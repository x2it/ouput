import { NextRequest } from 'next/server';
import { getAllWorks } from '@/storage/database/local-store';
import { requireAuth } from '../../auth/_utils';

// 导出格式与 backup 保持一致
export async function GET(request: NextRequest) {
  const unauth = await requireAuth(request);
  if (unauth) return unauth;
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const works = await getAllWorks();
    
    if (format === 'text') {
      // 文本格式：管道分隔
      const textContent = works
        .map((work) => `${work.title} | ${work.description} | ${work.link || ''} | ${work.image || ''}`)
        .join('\n');
      
      return new Response(textContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="works.txt"',
        },
      });
    } else {
      // JSON 格式 - 统一使用 { tables: { works: [...] } } 格式
      // 包含完整字段，与 backup 格式一致
      const exportData = {
        backupDate: new Date().toISOString(),
        version: '1.0',
        tables: {
          works: works,
        },
      };
      
      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="works-export.json"',
        },
      });
    }
  } catch (error) {
    console.error('导出失败:', error);
    return Response.json({ error: '导出失败' }, { status: 500 });
  }
}
