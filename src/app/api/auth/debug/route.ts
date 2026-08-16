import { NextRequest, NextResponse } from 'next/server';
import { getAuthState } from '../_utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 必须先登录才能查看诊断信息
  const authenticated = await getAuthState();
  if (!authenticated) {
    return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 });
  }

  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const xfp = request.headers.get('x-forwarded-proto') || '';
  const host = request.headers.get('host') || '';

  return NextResponse.json({
    authenticated,
    // 重要：不返回 tokenValue、allCookies，避免泄露 token 和 cookie
    cookieCount: (request.headers.get('cookie') || '').split(';').filter(Boolean).length,
    requestInfo: {
      origin,
      referer,
      xForwardedProto: xfp,
      host,
    },
    hint: authenticated
      ? '✓ 已登录，cookie 签名有效'
      : '✗ 未登录或 cookie 已失效',
  });
}
