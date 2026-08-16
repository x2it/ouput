import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '../_utils';

function buildClearCookieString(opts: {
  expires: Date;
  maxAge: number;
  secure: boolean;
  domain?: string;
}): string {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    `Expires=${opts.expires.toUTCString()}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (opts.secure) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  return parts.join('; ');
}

function clearCookieStrings(request: NextRequest): string[] {
  const xfp = request.headers.get('x-forwarded-proto');
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const isHttps =
    xfp === 'https' ||
    origin.startsWith('https://') ||
    referer.startsWith('https://') ||
    request.nextUrl.protocol === 'https:';

  const originSource = origin || referer;
  let parentDomain: string | undefined;
  try {
    const u = new URL(originSource);
    const host = u.hostname;
    if (host !== 'localhost' && !host.startsWith('127.')) {
      const parts = host.split('.');
      if (parts.length >= 2) parentDomain = '.' + parts.slice(-2).join('.');
    }
  } catch {
    const envDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
    if (envDomain) {
      try {
        const u = new URL(envDomain);
        const host = u.hostname;
        if (host !== 'localhost' && !host.startsWith('127.')) {
          const parts = host.split('.');
          if (parts.length >= 2) parentDomain = '.' + parts.slice(-2).join('.');
        }
      } catch {}
    }
  }

  // 始终清 local cookie（无 Domain）
  const strings: string[] = [
    buildClearCookieString({
      expires: new Date(0),
      maxAge: 0,
      secure: isHttps,
    }),
  ];
  // 再清父域 cookie（Domain=.coze.site）
  if (parentDomain) {
    strings.push(
      buildClearCookieString({
        expires: new Date(0),
        maxAge: 0,
        secure: true,
        domain: parentDomain,
      })
    );
  }
  return strings;
}

function appendClearCookies(response: NextResponse, request: NextRequest) {
  for (const s of clearCookieStrings(request)) {
    response.headers.append('Set-Cookie', s);
  }
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url), { status: 303 });
  appendClearCookies(response, request);
  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  appendClearCookies(response, request);
  return response;
}
