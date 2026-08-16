import { NextRequest, NextResponse } from 'next/server';
import { batchImportWorks } from '@/storage/database/local-store';
import { requireAuth } from '../../auth/_utils';

interface BatchItem {
  title: string;
  description: string;
  link?: string | null;
  image?: string | null;
}

export async function POST(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const body = await request.json();

    // 支持多种格式：
    // 1. 直接数组: [{ title, description, ... }]
    // 2. { items: [...] }
    // 3. { tables: { works: [...] } } - 备份格式

    let items: BatchItem[];

    if (Array.isArray(body)) {
      items = body;
    } else if (body.items && Array.isArray(body.items)) {
      items = body.items;
    } else if (body.tables?.works && Array.isArray(body.tables.works)) {
      items = body.tables.works;
    } else {
      return NextResponse.json({ error: '无效的数据格式' }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: '无有效数据' }, { status: 400 });
    }
    if (items.length > 1000) {
      return NextResponse.json({ error: '单次最多导入 1000 条' }, { status: 400 });
    }

    // 过滤有效数据 + 长度限制
    const validItems = items.filter((item) =>
      item && typeof item.title === 'string' && item.title.length > 0 && item.title.length <= 200 &&
      typeof item.description === 'string' && item.description.length > 0 && item.description.length <= 2000
    ).map((item) => ({
      title: item.title,
      description: item.description,
      link: item.link || null,
      image: item.image || null,
      sort_order: 0,
    }));

    if (validItems.length === 0) {
      return NextResponse.json({ error: '无有效数据（缺少标题或描述）' }, { status: 400 });
    }
    
    // 导入数据
    const imported = await batchImportWorks(validItems);

    return NextResponse.json({
      success: true,
      imported: imported.length,
      data: imported,
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    return NextResponse.json({ error: '批量导入失败' }, { status: 500 });
  }
}
