import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS 白名单：只允许同源 + 公网域名
 * 防止任意网站通过浏览器带 credentials 调 API
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = ['http://localhost:5000', 'http://127.0.0.1:5000'];
  const env = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  if (env && /^https?:\/\//.test(env)) {
    try {
      const u = new URL(env);
      origins.push(`${u.protocol}//${u.host}`);
    } catch {}
  }
  return origins;
}

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return true;
  // 允许父域子域：如 x.dev.coze.site 的请求
  try {
    const u = new URL(origin);
    for (const a of allowed) {
      try {
        const au = new URL(a);
        if (au.hostname.endsWith('.' + u.hostname.split('.').slice(-2).join('.')) ||
            u.hostname.endsWith('.' + au.hostname.split('.').slice(-2).join('.'))) {
          return true;
        }
      } catch {}
    }
  } catch {}
  return false;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowed = isOriginAllowed(origin);
  const corsOrigin = allowed ? origin : '';

  // 安全头：所有响应都加
  const applySecurityHeaders = (res: NextResponse) => {
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  };

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    applySecurityHeaders(response);
    if (corsOrigin) {
      response.headers.set('Access-Control-Allow-Origin', corsOrigin);
      response.headers.set('Vary', 'Origin');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  if (corsOrigin) {
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
