import { NextRequest, NextResponse } from 'next/server';
import { getAllWorks, createWork, clearAllWorks } from '@/storage/database/local-store';
import { requireAuth } from '../auth/_utils';

export async function GET() {
  try {
    const works = await getAllWorks();
    return NextResponse.json({ data: works });
  } catch (error) {
    console.error('获取作品失败:', error);
    return NextResponse.json({ error: '获取作品失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const { title, description, link, image } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: '标题和描述不能为空' }, { status: 400 });
    }

    // 限制字符串长度防止滥用
    if (typeof title !== 'string' || title.length > 200) {
      return NextResponse.json({ error: '标题无效' }, { status: 400 });
    }
    if (typeof description !== 'string' || description.length > 2000) {
      return NextResponse.json({ error: '描述无效' }, { status: 400 });
    }
    if (link !== undefined && link !== null && link !== '' && (typeof link !== 'string' || link.length > 2000)) {
      return NextResponse.json({ error: '链接无效' }, { status: 400 });
    }
    if (image !== undefined && image !== null && image !== '' && (typeof image !== 'string' || image.length > 2000)) {
      return NextResponse.json({ error: '图片链接无效' }, { status: 400 });
    }

    const newWork = await createWork({
      title,
      description,
      link: link || null,
      image: image || null,
      sort_order: 0,
    });

    return NextResponse.json({ data: newWork });
  } catch (error) {
    console.error('创建作品失败:', error);
    return NextResponse.json({ error: '创建作品失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    await clearAllWorks();
    return NextResponse.json({ success: true, message: '已清空所有作品' });
  } catch (error) {
    console.error('清空作品失败:', error);
    return NextResponse.json({ error: '清空作品失败' }, { status: 500 });
  }
}
