import { NextRequest } from 'next/server';
import { getWork, updateWork, deleteWork } from '@/storage/database/local-store';
import { requireAuth } from '../../auth/_utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const work = await getWork(parseInt(id));

    if (!work) {
      return Response.json({ error: '作品不存在' }, { status: 404 });
    }

    return Response.json({ data: work });
  } catch (error) {
    console.error('获取作品失败:', error);
    return Response.json({ error: '获取作品失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const { id } = await params;
    const body = await request.json();

    // 防止 id 伪造
    const { id: _preventedId, ...safeBody } = body as Record<string, unknown>;
    void _preventedId;

    const updated = await updateWork(parseInt(id), safeBody);

    if (!updated) {
      return Response.json({ error: '作品不存在' }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error('更新作品失败:', error);
    return Response.json({ error: '更新作品失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const { id } = await params;
    const deleted = await deleteWork(parseInt(id));

    if (!deleted) {
      return Response.json({ error: '作品不存在' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('删除作品失败:', error);
    return Response.json({ error: '删除作品失败' }, { status: 500 });
  }
}
