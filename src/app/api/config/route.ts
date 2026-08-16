import { NextRequest, NextResponse } from 'next/server';
import { getConfig, updateConfig } from '@/storage/database/local-store';
import { requireAuth } from '../auth/_utils';

const ALLOWED_KEYS = new Set([
  'site_name', 'site_slogan', 'seo_title', 'seo_description', 'layout_cols', 'copyright_text',
]);

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { error: '获取配置失败', data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: '请求体无效' }, { status: 400 });
    }
    // 白名单过滤：只允许更新已知 key
    const safeBody: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) {
      if (!ALLOWED_KEYS.has(k)) continue;
      if (typeof v !== 'string') continue;
      if (v.length > 500) continue;
      safeBody[k] = v;
    }
    if (Object.keys(safeBody).length === 0) {
      return NextResponse.json({ error: '无可更新的字段' }, { status: 400 });
    }
    const updated = await updateConfig(safeBody as unknown as Parameters<typeof updateConfig>[0]);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
  }
}
