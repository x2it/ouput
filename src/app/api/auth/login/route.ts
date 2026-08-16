import { NextRequest, NextResponse } from 'next/server';
import { buildCookieOptions, COOKIE_NAME, makeToken } from '../_utils';

// 简化的密码认证 - 用 HttpOnly cookie 持久化
// 密码必须通过环境变量 ADMIN_PASSWORD 设置（无默认值，避免硬编码密码泄露到开源仓库）
const PASSWORD = process.env.ADMIN_PASSWORD || '';

// 启动时检查：未设置 ADMIN_PASSWORD 时拒绝登录（安全默认）
if (!PASSWORD) {
  console.warn(
    '\n⚠️  [security] ADMIN_PASSWORD 未设置，登录接口将拒绝所有请求。请在环境变量中设置后重启。\n'
  );
}

// 简易内存级限流（开发/单实例足够；生产建议接 Redis）
// key: IP+UA 的简单哈希，value: { count, lockedUntil }
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 分钟

function getClientKey(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return ip;
}

function checkLockout(key: string): { locked: boolean; remaining: number } {
  const record = failedAttempts.get(key);
  if (!record) return { locked: false, remaining: 0 };
  const now = Date.now();
  if (record.lockedUntil > now) {
    return { locked: true, remaining: Math.ceil((record.lockedUntil - now) / 1000) };
  }
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    failedAttempts.delete(key); // 锁定期过了就清空
  }
  return { locked: false, remaining: 0 };
}

function recordFailure(key: string): { locked: boolean; remaining: number } {
  const record = failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_DURATION;
    failedAttempts.set(key, record);
    return { locked: true, remaining: LOCK_DURATION / 1000 };
  }
  failedAttempts.set(key, record);
  return { locked: false, remaining: MAX_ATTEMPTS - record.count };
}

function clearFailures(key: string) {
  failedAttempts.delete(key);
}

// 关键：按优先级推断用户实际访问的 origin
// 沙箱隧道不传 Host 头，dev server 永远看到 Host=localhost:5000
// 但浏览器 form 提交一定会带 Origin 头（用户实际访问的域名）
// 优先级：Origin > Referer > COZE_PROJECT_DOMAIN_DEFAULT > request.nextUrl.origin > Host
function getBaseUrl(request: NextRequest): string {
  // 1. 浏览器 form 提交必带 Origin 头（最可靠 - 用户实际访问的域名）
  const origin = request.headers.get('origin');
  if (origin && /^https?:\/\//.test(origin)) return origin;

  // 2. Referer 头（用户从哪个页面点过来的）
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch {}
  }

  // 3. 环境变量（沙箱自动注入的公网域名）
  const publicDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  if (publicDomain && /^https?:\/\//.test(publicDomain)) return publicDomain;

  // 4. request.nextUrl.origin（沙箱内部 localhost，仅在没有浏览器头时 fallback）
  try {
    if (request.nextUrl?.origin) return request.nextUrl.origin;
  } catch {}

  // 5. 最后回退到 Host
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  if (!host) return 'http://localhost:5000';
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  const baseUrl = getBaseUrl(request);

  // 安全默认：未配置 ADMIN_PASSWORD 时拒绝所有登录（避免硬编码密码泄露到开源仓库）
  if (!PASSWORD) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('error', 'not-configured');
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const lock = checkLockout(clientKey);
  if (lock.locked) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('error', `locked:${lock.remaining}`);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  try {
    const formData = await request.formData();
    const password = formData.get('password') as string;

    if (password !== PASSWORD) {
      const result = recordFailure(clientKey);
      const loginUrl = new URL('/login', baseUrl);
      if (result.locked) {
        loginUrl.searchParams.set('error', `locked:${result.remaining}`);
      } else {
        loginUrl.searchParams.set('error', `1:${result.remaining}`);
      }
      return NextResponse.redirect(loginUrl, { status: 303 });
    }

    // 密码正确：清空失败计数 + 设置 cookie
    clearFailures(clientKey);
    const response = NextResponse.redirect(new URL('/', baseUrl), { status: 303 });
    response.cookies.set(COOKIE_NAME, makeToken(), buildCookieOptions(request));
    return response;
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}

// JSON 提交（用于客户端 fetch 增强）
export async function PUT(request: NextRequest) {
  const clientKey = getClientKey(request);

  // 安全默认：未配置 ADMIN_PASSWORD 时拒绝所有登录
  if (!PASSWORD) {
    return NextResponse.json({ error: '未配置管理员密码' }, { status: 503 });
  }

  const lock = checkLockout(clientKey);
  if (lock.locked) {
    return NextResponse.json(
      { error: 'locked', remaining: lock.remaining },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();
    if (password !== PASSWORD) {
      const result = recordFailure(clientKey);
      return NextResponse.json(
        {
          error: result.locked ? 'locked' : '密码错误',
          remaining: result.locked ? result.remaining : result.remaining,
        },
        { status: 401 }
      );
    }
    clearFailures(clientKey);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, makeToken(), buildCookieOptions(request));
    return response;
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
