-- =============================================
-- 7喵仓库 - 数据库初始化脚本
-- 目标：Supabase (PostgreSQL)
-- 说明：在 Supabase SQL Editor 中执行本脚本即可完成建表
-- =============================================

-- ---------- 1. 作品表 works ----------
CREATE TABLE IF NOT EXISTS public.works (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  image TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- 2. 站点配置表 site_config（列式，单行） ----------
CREATE TABLE IF NOT EXISTS public.site_config (
  id SERIAL PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT '7喵仓库',
  site_slogan TEXT NOT NULL DEFAULT '作品，即答案',
  seo_title TEXT,
  seo_description TEXT,
  layout_cols VARCHAR(10) DEFAULT 'auto',
  copyright_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- 3. 插入默认站点配置（单行） ----------
-- 注意：site_name / site_slogan / copyright_text 请改成你自己的品牌信息
INSERT INTO public.site_config (site_name, site_slogan, seo_title, seo_description, layout_cols, copyright_text)
VALUES ('7喵仓库', '作品，即答案', '7喵仓库 - 个人作品集', '7喵仓库的个人作品展示网站', 'auto', '')
ON CONFLICT DO NOTHING;

-- ---------- 4. 示例作品（可选，自行删除） ----------
-- INSERT INTO public.works (title, description, link, sort_order) VALUES
-- ('示例作品 1', '这是第一个示例作品', 'https://example.com', 0);

-- ---------- 5. 索引（按排序查询优化） ----------
CREATE INDEX IF NOT EXISTS idx_works_sort_order ON public.works (sort_order);

-- ---------- 6. RLS 策略（可选，如需启用行级安全） ----------
-- 提示：本项目服务端使用 service_role key 直连，可跳过 RLS；
-- 若需 RLS，请在 Supabase Dashboard 中手动为 works/site_config 配置策略。
