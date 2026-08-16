import { NextResponse } from 'next/server';
import { getConfig, DEFAULT_CONFIG } from '@/storage/database/local-store';

export async function GET() {
  try {
    const config = await getConfig();
    const siteName = config.site_name || DEFAULT_CONFIG.site_name;
    const siteSlogan = config.site_slogan || DEFAULT_CONFIG.site_slogan;

    return NextResponse.json({
      site_name: siteName,
      site_slogan: siteSlogan,
      seo_title: config.seo_title || `${siteName} - ${siteSlogan}`,
      seo_description: config.seo_description || `${siteName} - ${siteSlogan}`,
      copyright_text: config.copyright_text || '',
    });
  } catch {
    // 返回默认值
    return NextResponse.json({
      site_name: DEFAULT_CONFIG.site_name,
      site_slogan: DEFAULT_CONFIG.site_slogan,
      seo_title: `${DEFAULT_CONFIG.site_name} - ${DEFAULT_CONFIG.site_slogan}`,
      seo_description: `${DEFAULT_CONFIG.site_name} - ${DEFAULT_CONFIG.site_slogan}`,
      copyright_text: '',
    });
  }
}
