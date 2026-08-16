import { NextRequest, NextResponse } from 'next/server';
import { pinWork } from '@/storage/database/local-store';
import { requireAuth } from '../../auth/_utils';

export async function POST(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const { id } = await request.json();
    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: '无效的作品 ID' }, { status: 400 });
    }
    await pinWork(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('置顶作品失败:', error);
    return NextResponse.json({ error: '置顶作品失败' }, { status: 500 });
  }
}
