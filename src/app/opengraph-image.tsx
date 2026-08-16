import { ImageResponse } from 'next/og';

// 动态生成 OG 分享图，跟随后台白标配置（站名 / Slogan）
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = '作品集分享卡片';

export default async function OpengraphImage() {
  // 读取配置（失败则回退默认值，保证分享卡片始终可用）
  let siteName = '7喵仓库';
  let siteSlogan = '作品，即答案';
  let worksCount: number | null = null;
  try {
    const mod = await import('@/storage/database/local-store');
    const config = await mod.getConfig().catch(() => null);
    if (config) {
      if (typeof config.site_name === 'string' && config.site_name) siteName = config.site_name;
      if (typeof config.site_slogan === 'string' && config.site_slogan) siteSlogan = config.site_slogan;
    }
    const works = await mod.getAllWorks().catch(() => []);
    worksCount = Array.isArray(works) ? works.length : null;
  } catch {
    // 保持默认值
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #faf9f6 0%, #f0efea 100%)',
          fontFamily: 'sans-serif',
          padding: '80px 100px',
        }}
      >
        {/* 顶部小标识 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '9999px',
              background: '#f59e0b',
            }}
          />
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '9999px',
              background: '#3b82f6',
            }}
          />
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '9999px',
              background: '#10b981',
            }}
          />
        </div>

        {/* 站名 */}
        <div
          style={{
            fontSize: '84px',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.1,
            display: 'flex',
          }}
        >
          {siteName}
        </div>

        {/* Slogan */}
        <div
          style={{
            fontSize: '36px',
            color: '#6b7280',
            marginTop: '28px',
            textAlign: 'center',
            display: 'flex',
          }}
        >
          {siteSlogan}
        </div>

        {/* 底部信息 */}
        <div
          style={{
            position: 'absolute',
            bottom: '56px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '24px',
            color: '#9ca3af',
          }}
        >
          <span>{worksCount !== null ? `${worksCount} 个作品` : '个人作品集'}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
