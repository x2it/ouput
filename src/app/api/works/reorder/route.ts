import { NextRequest } from 'next/server';
import { reorderWorks } from '@/storage/database/local-store';
import { requireAuth } from '../../auth/_utils';

export async function POST(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return Response.json({ error: '无效的数据格式' }, { status: 400 });
    }
    if (updates.length > 1000) {
      return Response.json({ error: '数据量超过限制' }, { status: 400 });
    }

    const orderedIds = updates
      .filter((u: unknown): u is { id: number; order: number } =>
        typeof u === 'object' && u !== null &&
        typeof (u as { id?: unknown }).id === 'number' &&
        typeof (u as { order?: unknown }).order === 'number'
      )
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      .map((u: { id: number }) => u.id);

    await reorderWorks(orderedIds);

    return Response.json({ success: true });
  } catch (error) {
    console.error('排序失败:', error);
    return Response.json({ error: '排序失败' }, { status: 500 });
  }
}
