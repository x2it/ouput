import { NextRequest, NextResponse } from 'next/server';
import { getConfig, updateConfig, DEFAULT_CONFIG } from '@/storage/database/local-store';
import { requireAuth } from '../auth/_utils';

// 初始化配置
export async function POST(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const config = await getConfig();
    if (!config.site_name) {
      await updateConfig(DEFAULT_CONFIG);
    }

    return NextResponse.json({
      success: true,
      message: '初始化完成',
      config: await getConfig()
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

// 获取当前配置状态
export async function GET() {
  try {
    return NextResponse.json({
      mode: 'production',
      config: await getConfig(),
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
