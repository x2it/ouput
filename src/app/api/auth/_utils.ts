import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'auth_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

/**
 * 签名 token：payload（userId + 过期时间戳） + HMAC-SHA256
 * 这样即使 cookie 被窃取，到期自动失效，且能被服务端校验完整性
 */
const SECRET = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || 'change-me-in-production';

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return b.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', SECRET).update(payload).digest());
}

export function makeToken(): string {
  const exp = Date.now() + COOKIE_MAX_AGE * 1000;
  // 随机 nonce 防重放
  const nonce = randomBytes(8).toString('hex');
  const payload = `${exp}.${nonce}`;
  return `${b64url(payload)}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadEnc, sig] = parts;
  let payload: string;
  try {
    payload = b64urlDecode(payloadEnc).toString('utf8');
  } catch {
    return false;
  }
  const expected = sign(payload);
  // timingSafeEqual 防时序攻击
  let sigBuf: Buffer, expBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig);
    expBuf = Buffer.from(expected);
  } catch {
    return false;
  }
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;
  const exp = Number(payload.split('.')[0]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return true;
}

/**
 * 动态构造 cookie 选项
 * 原则：浏览器实际访问的 host 决定 Domain：
 *   - host 是 localhost/127.*：不设 Domain，cookie 只在 localhost 生效
 *   - host 是其他：取最后两段作为父域（如 .coze.site），跨子域共享
 */
export function buildCookieOptions(request: NextRequest) {
  const xfh = request.headers.get('x-forwarded-host') || '';
  const reqHost = request.headers.get('host') || '';
  const requestHost = xfh || reqHost;
  const isLocalhost = /^localhost(:\d+)?$/.test(requestHost) || /^127\./.test(requestHost);

  // 1. localhost：绝对不设 Domain
  if (isLocalhost) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    };
  }

  // 2. 公网：取最后两段作为父域
  let domain: string | undefined;
  try {
    const u = new URL(`https://${requestHost}`);
    const host = u.hostname;
    if (host !== 'localhost' && !host.startsWith('127.')) {
      const parts = host.split('.');
      if (parts.length >= 2) domain = '.' + parts.slice(-2).join('.');
    }
  } catch {
    const envDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
    if (envDomain) {
      try {
        const u = new URL(envDomain);
        const host = u.hostname;
        if (host !== 'localhost' && !host.startsWith('127.')) {
          const parts = host.split('.');
          if (parts.length >= 2) domain = '.' + parts.slice(-2).join('.');
        }
      } catch {}
    }
  }

  const xfp = request.headers.get('x-forwarded-proto');
  const isHttps = xfp === 'https' || request.nextUrl.protocol === 'https:';

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    ...(domain ? { domain } : {}),
  };
}

/**
 * 服务端读取认证状态（HMAC 签名校验）
 */
export async function getAuthState(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);
    return verifyToken(token?.value);
  } catch {
    return false;
  }
}

/**
 * 写操作鉴权：未通过则返回 401 响应；通过则返回 null
 * 使用：
 *   const unauth = await requireAuth(request);
 *   if (unauth) return unauth;
 */
export async function requireAuth(_request: NextRequest): Promise<NextResponse | null> {
  // 1. 优先从 Cookie 头读（更可靠，不依赖 next/headers 的运行时）
  const cookieHeader = _request.headers.get('cookie') || '';
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const fromHeader = m ? decodeURIComponent(m[1]) : null;

  // 2. fallback 到 next/headers（route handler 内部场景）
  let fromStore: string | null = null;
  if (!fromHeader) {
    try {
      const cookieStore = await cookies();
      fromStore = cookieStore.get(COOKIE_NAME)?.value || null;
    } catch {}
  }

  const token = fromHeader || fromStore;
  if (verifyToken(token)) return null;

  return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 });
}
