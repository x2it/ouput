'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Work {
  id: number;
  title: string;
  description: string;
  link: string | null;
  image: string | null;
  sort_order: number;
}

interface Config {
  site_name: string;
  site_slogan: string;
  seo_title?: string;
  seo_description?: string;
  layout_cols?: 'auto' | '2' | '3';
  copyright_text?: string;
}

interface BatchItem {
  title: string;
  description: string;
  link?: string;
  image?: string;
}

// Theme configuration - defined outside component to avoid dependency issues
const themes = [
  { id: 'neutral', name: '简约灰', colors: ['#faf9f6', '#f5f5f4', '#faf9f6'], menuBg: 'bg-white/95', menuBorder: 'border-gray-100/50', menuText: 'text-gray-700' },
  { id: 'blue', name: '天空蓝', colors: ['#e0f2fe', '#f0f9ff', '#e0f2fe'], menuBg: 'bg-blue-50/95', menuBorder: 'border-blue-100/50', menuText: 'text-blue-900' },
  { id: 'green', name: '森林绿', colors: ['#dcfce7', '#f0fdf4', '#dcfce7'], menuBg: 'bg-green-50/95', menuBorder: 'border-green-100/50', menuText: 'text-green-900' },
  { id: 'purple', name: '梦幻紫', colors: ['#f3e8ff', '#faf5ff', '#f3e8ff'], menuBg: 'bg-purple-50/95', menuBorder: 'border-purple-100/50', menuText: 'text-purple-900' },
  { id: 'warm', name: '暖阳橙', colors: ['#fed7aa', '#ffedd5', '#fed7aa'], menuBg: 'bg-orange-50/95', menuBorder: 'border-orange-100/50', menuText: 'text-orange-900' },
  { id: 'dark', name: '深邃黑', colors: ['#18181b', '#27272a', '#18181b'], menuBg: 'bg-gray-900/95', menuBorder: 'border-gray-700/50', menuText: 'text-gray-100' },
  { id: 'sunset', name: '落日红', colors: ['#fecaca', '#fecdd3', '#fed7aa'], menuBg: 'bg-red-50/95', menuBorder: 'border-red-100/50', menuText: 'text-red-900' },
  { id: 'ocean', name: '海洋蓝', colors: ['#cffafe', '#e0f2fe', '#bae6fd'], menuBg: 'bg-cyan-50/95', menuBorder: 'border-cyan-100/50', menuText: 'text-cyan-900' },
  { id: 'aurora', name: '极光紫', colors: ['#e9d5ff', '#f3e8ff', '#ddd6fe'], menuBg: 'bg-violet-50/95', menuBorder: 'border-violet-100/50', menuText: 'text-violet-900' },
  { id: 'neon', name: '霓虹粉', colors: ['#fbcfe8', '#f9a8d4', '#f472b6'], menuBg: 'bg-pink-50/95', menuBorder: 'border-pink-100/50', menuText: 'text-pink-900' },
  { id: 'mint', name: '薄荷绿', colors: ['#a7f3d0', '#d1fae5', '#6ee7b7'], menuBg: 'bg-emerald-50/95', menuBorder: 'border-emerald-100/50', menuText: 'text-emerald-900' },
] as const;

function SortableWorkCard({ work, index, isEditMode, isPinned, onEdit, onDelete, onPin }: { work: Work; index: number; isEditMode: boolean; isPinned: boolean; onEdit: (work: Work) => void; onDelete: (id: number) => void; onPin: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: work.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  // 根据索引选择颜色，10种互不重复，兼容暗色模式
  const cardColors = [
    'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700',
    'bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900 dark:to-sky-800',
    'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800',
    'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800',
    'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800',
    'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900 dark:to-rose-800',
    'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800',
    'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800',
    'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800',
    'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800',
  ];
  const cardColor = cardColors[index % cardColors.length];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative backdrop-blur-sm rounded-2xl p-8 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''} shadow-sm hover:shadow-xl transition-all duration-300 aspect-[4/3] flex flex-col border border-white/30 hover:border-white/50 ${cardColor}`}
      {...(isEditMode ? listeners : {})}
    >
      {/* 编辑模式下的操作按钮 */}
      {isEditMode && (
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(work.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`p-1.5 rounded-lg shadow-sm transition-colors ${isPinned ? 'bg-amber-100 text-amber-700' : 'bg-white/90 hover:bg-amber-50 text-gray-700 hover:text-amber-700'}`}
            title={isPinned ? '取消置顶' : '置顶'}
          >
            <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(work); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm text-gray-700 hover:text-gray-900 transition-colors"
            title="编辑"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('确定删除？')) onDelete(work.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm text-red-500 hover:text-red-700 transition-colors"
              title="删除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
      )}

      <h2 className="text-2xl font-semibold text-gray-900 mb-3 leading-tight group-hover:text-gray-700 transition-colors">{work.title}</h2>
      <p className="text-base text-gray-600 flex-1 leading-relaxed">{work.description}</p>
      
      {work.link && (
        <a 
          href={work.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 mt-6 text-gray-900 text-sm font-medium hover:text-gray-600 transition-colors group-hover:translate-x-1 transform duration-300"
        >
          查看
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      )}
    </div>
  );
}

interface HomeClientProps {
  initialWorks?: Work[];
  initialConfig?: Config & { layout_cols?: string } | null;
  initialAuth?: boolean;
  publicDomain?: string;
}

export default function HomePage({ initialWorks, initialConfig, initialAuth = false, publicDomain = '' }: HomeClientProps) {
  const [works, setWorks] = useState<Work[]>(initialWorks || []);
  const [config, setConfig] = useState<Config>(initialConfig || { site_name: '7喵仓库', site_slogan: '作品，即答案' });
  const [loading, setLoading] = useState(!initialWorks);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [isEditMode, setIsEditMode] = useState(false);
  // 是否处于开发预览（IDE 预览 = localhost），用 useEffect 避免 hydration mismatch
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hostname;
    setIsLocalPreview(h === 'localhost' || h === '127.0.0.1' || window.location.protocol === 'http:');
  }, []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', link: '', image: '' });
  
  // 新增：后台功能相关状态
  const [showSettings, setShowSettings] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCols, setEmbedCols] = useState<string>('auto'); // 'auto' | '1' | '2' | '3' | '4'
  const [embedHeight, setEmbedHeight] = useState<number>(0); // 0 = 自动高度
  const [embedGap, setEmbedGap] = useState('6');
  const [embedShowHeader, setEmbedShowHeader] = useState(true);
  const [embedShowFooter, setEmbedShowFooter] = useState(true);
  const [embedLimit, setEmbedLimit] = useState(0); // 0 = 全部
  const [embedTheme, setEmbedTheme] = useState('colorful');
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [clearImageOnImport, setClearImageOnImport] = useState(false);
  const [configData, setConfigData] = useState({ site_name: '7喵仓库', site_slogan: '作品，即答案', seo_title: '', seo_description: '', layout_cols: 'auto' as 'auto' | '2' | '3', copyright_text: '' });
  const [importText, setImportText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('neutral');
  const [layoutCols, setLayoutCols] = useState<'auto' | '2' | '3'>('auto');

  // 嵌入代码生成
  // 计算实际列数
  const actualCols = useMemo(() => {
    if (layoutCols !== 'auto') return Number(layoutCols);
    const count = works.length;
    if (count <= 2) return count; // 1或2个时按实际数量
    if (count % 3 === 0) return 3; // 3的倍数→3列
    if (count % 2 === 0) return 2; // 2的倍数→2列
    return 3; // 默认3列
  }, [layoutCols, works.length]);

  const gridColsClass = useMemo(() => {
    switch (actualCols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  }, [actualCols]);

  const embedIframeCode = useMemo(() => {
    // 优先使用服务端注入的公共域名（COZE_PROJECT_DOMAIN_DEFAULT），
    // 避免在 dev 环境下生成 http://localhost:5000 的不可访问链接
    const origin = publicDomain || (typeof window !== 'undefined' ? window.location.origin : '');
    const params = new URLSearchParams();
    params.set('theme', embedTheme);
    if (embedCols !== 'auto') params.set('cols', embedCols);
    // auto 时不传 cols，让 embed 页面自动响应式
    params.set('gap', embedGap);
    if (!embedShowHeader) params.set('header', 'false');
    if (!embedShowFooter) params.set('footer', 'false');
    if (embedLimit > 0) params.set('limit', String(embedLimit));

    const src = `${origin}/embed?${params.toString()}`;

    if (embedHeight > 0) {
      // 固定高度模式
      return `<iframe\n  src="${src}"\n  width="100%"\n  height="${embedHeight}"\n  frameborder="0"\n  style="border: 1px solid #e5e7eb; border-radius: 16px;">\n</iframe>`;
    }

    // 自动高度模式：通过 postMessage 动态调整 iframe 高度
    return `<iframe\n  id="qmeow-embed"\n  src="${src}"\n  width="100%"\n  frameborder="0"\n  scrolling="no"\n  style="border: 1px solid #e5e7eb; border-radius: 16px; min-height: 200px;"\n  onload="this.style.height=this.contentDocument?.body?.scrollHeight+'px'">\n</iframe>\n<script>\n(function(){var f=document.getElementById('qmeow-embed');window.addEventListener('message',function(e){if(e.data&&e.data.type==='embed-height'&&f&&e.source===f.contentWindow){f.style.height=e.data.height+'px';}});})();\n</script>`;
  }, [embedTheme, embedCols, embedHeight, embedGap, embedShowHeader, embedShowFooter, embedLimit, publicDomain]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleThemeChange = useCallback((themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('theme', themeId);
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      document.body.style.setProperty('--theme-gradient-start', theme.colors[0]);
      document.body.style.setProperty('--theme-gradient-mid', theme.colors[1]);
      document.body.style.setProperty('--theme-gradient-end', theme.colors[2]);
      if (themeId === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setShowThemeMenu(false);
  }, []);

  const getCurrentTheme = () => themes.find(t => t.id === currentTheme) || themes[0];

  useEffect(() => {
    fetchWorks();
    fetchConfig();

    // 兜底：客户端再次校验认证状态（应对多 tab 或外部清除 cookie 的情况）
    // 主要认证状态由 Server Component 通过 cookie 决定
    const verifyAuth = async () => {
      try {
        const res = await fetch('/api/auth/verify', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated !== isAuthenticated) {
            setIsAuthenticated(data.authenticated);
          }
        }
      } catch {
        // 静默失败 - 已使用 SSR 阶段的认证状态
      }
    };
    verifyAuth();

    // 初始化主题
    try {
      const savedTheme = localStorage.getItem('theme') || 'neutral';
      handleThemeChange(savedTheme);
    } catch {
      handleThemeChange('neutral');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!showThemeMenu && !showBatchMenu && !showMobileMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.theme-menu') && !target.closest('.batch-menu') && !target.closest('.mobile-menu')) {
        setShowThemeMenu(false);
        setShowBatchMenu(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showThemeMenu, showBatchMenu, showMobileMenu]);

  const fetchWorks = async () => {
    try {
      const res = await fetch('/api/works', { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setWorks(json.data || []);
    } catch (err) {
      console.error('fetchWorks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config', { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const configData = json.data || { site_name: '7喵仓库', site_slogan: '作品，即答案', seo_title: '', seo_description: '', layout_cols: 'auto', copyright_text: '' };
      setConfig({ site_name: configData.site_name, site_slogan: configData.site_slogan });
      setConfigData(configData);
      if (configData.layout_cols) {
        setLayoutCols(configData.layout_cols as 'auto' | '2' | '3');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isEditMode || isPreviewMode) return;
    
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = works.findIndex((w) => w.id === active.id);
      const newIndex = works.findIndex((w) => w.id === over.id);
      const newWorks = arrayMove(works, oldIndex, newIndex);
      setWorks(newWorks);
      
      const updates = newWorks.map((w, i) => ({ id: w.id, order: i + 1 }));
      await fetch('/api/works/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return alert('请填写完整');
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setFormData({ title: '', description: '', link: '', image: '' });
      setShowForm(false);
      fetchWorks();
    } catch (error) {
      console.error('添加作品失败:', error);
      alert(`添加失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork || !formData.title || !formData.description) return alert('请填写完整');
    try {
      const res = await fetch(`/api/works/${editingWork.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setEditingWork(null);
      setFormData({ title: '', description: '', link: '', image: '' });
      setShowForm(false);
      fetchWorks();
    } catch (error) {
      console.error('更新作品失败:', error);
      alert(`更新失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/works/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      fetchWorks();
    } catch (error) {
      console.error('删除作品失败:', error);
      alert(`删除失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handlePin = async (id: number) => {
    try {
      const res = await fetch('/api/works/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      fetchWorks();
    } catch (error) {
      console.error('置顶作品失败:', error);
      alert(`置顶失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 网站设置
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configData.site_name || !configData.site_slogan) return alert('请填写完整');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
      if ((await res.json()).error) throw new Error();
      setConfig(configData);
      setLayoutCols(configData.layout_cols || 'auto');
      setShowSettings(false);
      alert('配置已更新');
    } catch {
      alert('更新失败');
    }
  };

  // 批量导入导出
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return alert('请输入内容或上传文件');
    try {
      let parsedJson;
      try {
        parsedJson = JSON.parse(importText);
      } catch {
        // 文本格式：管道分隔
        const lines = importText.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split('|').map(p => p.trim());
            return { title: parts[0], description: parts[1], link: parts[2], image: parts[3] } as BatchItem;
          });
        const validItems = lines.filter((i: BatchItem) => i.title && i.description);
        if (validItems.length === 0) return alert('无有效数据');
        
        const res = await fetch('/api/works/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: validItems }),
        });
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        setImportText('');
        setShowBatch(false);
        fetchWorks();
        alert(`成功导入 ${result.imported} 个作品`);
        return;
      }
      
      // JSON 格式处理
      let items: BatchItem[];
      
      // 检查是否是备份格式
      if (parsedJson.tables?.works && Array.isArray(parsedJson.tables.works)) {
        // 备份文件格式：{ tables: { works: [...] } }
        items = parsedJson.tables.works.map((work: Work) => ({
          title: work.title,
          description: work.description,
          link: work.link || '',
          image: work.image || '',
        }));
      } else if (Array.isArray(parsedJson)) {
        // 直接数组格式
        items = parsedJson;
      } else if (parsedJson.items && Array.isArray(parsedJson.items)) {
        // 标准批量格式：{ items: [...] }
        items = parsedJson.items;
      } else {
        return alert('无效的 JSON 格式');
      }
      
      const validItems = items.filter((i: BatchItem) => i.title && i.description);
      if (validItems.length === 0) return alert('无有效数据');
      
      const res = await fetch('/api/works/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: validItems.map((item) => ({
            ...item,
            image: clearImageOnImport ? null : (item.image || null),
          })),
          clearImage: clearImageOnImport,
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setImportText('');
      setClearImageOnImport(false);
      setShowBatch(false);
      fetchWorks();
      alert(`成功导入 ${result.imported} 个作品${clearImageOnImport ? '（已清空 Image）' : ''}`);
    } catch (err) {
      console.error('导入失败:', err);
      alert('导入失败，请检查格式');
    }
  };

  const handleExport = async (format: 'json' | 'text') => {
    try {
      const res = await fetch(`/api/works/export?format=${format}`);
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `works.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('导出失败');
    }
  };

  const handleBackup = async (format: 'json' | 'sql') => {
    if (!confirm('确定要备份数据库吗？这将备份所有作品和配置数据。')) return;
    try {
      const res = await fetch(`/api/backup?format=${format}`);
      if (!res.ok) throw new Error('备份失败');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const backupDate = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `7meow-backup-${backupDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      alert(`数据库备份成功！`);
    } catch (error) {
      console.error('备份失败:', error);
      alert('备份失败，请重试');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 开发预览提示横幅 - 检测到 localhost/HTTP 时显示，强烈提醒去公网域名 */}
      {isLocalPreview && publicDomain && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-2 text-sm">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-2xl">🚧</span>
              <div className="flex-1">
                <div className="font-bold">你正在 IDE 开发预览中</div>
                <div className="text-xs opacity-90 mt-0.5">
                  此处 <code className="bg-black/20 px-1.5 py-0.5 rounded text-xs">localhost:5000</code> 登录的 cookie 与公网域名隔离。<strong>请到下方公网域名登录和管理</strong>。
                </div>
              </div>
            </div>
            <a
              href={publicDomain}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap"
            >
              打开公网域名 ↗
            </a>
          </div>
        </div>
      )}
      {/* 导航栏 - 站名居中，右上角放置操作按钮 */}
      <nav className="px-4 sm:px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-50">
        {/* 左侧：汉堡菜单（仅移动端） */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white/50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* 中间：站名居中 */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-lg sm:text-xl font-medium text-gray-900">{config.site_name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{config.site_slogan}</p>
        </div>
        
        {/* 右上角：管理 */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {isAuthenticated ? (
            <>
              {/* 桌面端：显示所有按钮 */}
              <div className="hidden sm:flex items-center gap-2">
                {isEditMode && !isPreviewMode && (
                  <>
                    <button
                      onClick={() => { setFormData({ title: '', description: '', link: '', image: '' }); setShowForm(true); }}
                      className="text-sm bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300 touch-manipulation"
                    >
                      添加作品
                    </button>
                    <button
                      onClick={() => { setShowSettings(true); }}
                      className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 touch-manipulation"
                    >
                      设置
                    </button>
                    <button
                      onClick={() => { setShowThemeMenu(!showThemeMenu); setShowBatchMenu(false); }}
                      className="theme-menu text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 touch-manipulation relative"
                    >
                      主题
                      {/* 主题下拉菜单 */}
                      {showThemeMenu && (() => {
                        const theme = getCurrentTheme();
                        return (
                          <div className={`absolute top-full right-0 mt-2 w-48 ${theme.menuBg} backdrop-blur-sm rounded-xl shadow-lg border ${theme.menuBorder} z-50 overflow-hidden`}>
                            {themes.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => handleThemeChange(t.id)}
                                className={`w-full px-4 py-3 text-left text-sm hover:bg-white/30 transition-colors flex items-center gap-3 ${t.id === 'dark' ? 'hover:bg-white/10' : ''}`}
                              >
                                <div className="flex gap-1">
                                  {t.colors.slice(0, 3).map((color, index) => (
                                    <div key={index} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                  ))}
                                </div>
                                <span className={t.id === 'dark' ? 'text-gray-200' : 'text-gray-700'}>{t.name}</span>
                                {currentTheme === t.id && (
                                  <svg className={`w-4 h-4 ${t.id === 'dark' ? 'text-gray-200' : 'text-gray-900'} ml-auto`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </button>
                    <button
                      onClick={() => { setShowBatchMenu(!showBatchMenu); setShowThemeMenu(false); }}
                      className="batch-menu text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 touch-manipulation relative"
                    >
                      批量
                      {/* 批量下拉菜单 */}
                      {showBatchMenu && (() => {
                        const theme = getCurrentTheme();
                        return (
                          <div className={`absolute top-full right-0 mt-2 w-48 ${theme.menuBg} backdrop-blur-sm rounded-xl shadow-lg border ${theme.menuBorder} z-50 overflow-hidden`}>
                            <button
                              onClick={() => { setShowBatch(true); setShowBatchMenu(false); }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/30 transition-colors ${currentTheme === 'dark' ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700'}`}
                            >
                              批量导入
                            </button>
                            <button
                              onClick={() => { handleExport('json'); setShowBatchMenu(false); }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/30 transition-colors ${currentTheme === 'dark' ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700'}`}
                            >
                              导出 JSON
                            </button>
                            <button
                              onClick={() => { handleExport('text'); setShowBatchMenu(false); }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/30 transition-colors ${currentTheme === 'dark' ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700'}`}
                            >
                              导出 TXT
                            </button>
                            <div className={`border-t ${theme.menuBorder.replace('/50', '/20')}`} />
                            <button
                              onClick={async () => {
                                if (!confirm('确定要清空所有作品吗？此操作不可恢复。')) return;
                                try {
                                  const res = await fetch('/api/works', { method: 'DELETE' });
                                  if (res.ok) {
                                    fetchWorks();
                                    setShowBatchMenu(false);
                                    alert('已清空所有作品');
                                  }
                                } catch {
                                  alert('清空失败');
                                }
                              }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/30 transition-colors text-red-600`}
                            >
                              清空所有作品
                            </button>
                          </div>
                        );
                      })()}
                    </button>
                    <button
                      onClick={() => { setShowEmbed(true); }}
                      className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 touch-manipulation"
                    >
                      嵌入
                    </button>
                  </>
                )}
                <button
                  onClick={() => { 
                    if (isPreviewMode) {
                      setIsPreviewMode(false);
                      setIsEditMode(true);
                    } else if (isEditMode) {
                      setIsPreviewMode(true);
                      setIsEditMode(false);
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  className={`text-sm px-3 py-2 rounded-lg transition-all duration-300 touch-manipulation ${
                    isPreviewMode || isEditMode
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {isPreviewMode ? '返回编辑' : isEditMode ? '预览' : '编辑'}
                </button>
                <button
                  onClick={async () => {
                    try { await fetch('/api/auth/logout', { method: 'DELETE' }); } catch {}
                    setIsAuthenticated(false);
                    setIsEditMode(false);
                    setIsPreviewMode(false);
                    window.location.href = '/';
                  }}
                  className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 touch-manipulation"
                >
                  退出
                </button>
              </div>

              {/* 移动端：只显示编辑按钮 */}
              <div className="flex sm:hidden items-center gap-2">
                <button
                  onClick={() => { 
                    if (isPreviewMode) {
                      setIsPreviewMode(false);
                      setIsEditMode(true);
                    } else if (isEditMode) {
                      setIsPreviewMode(true);
                      setIsEditMode(false);
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  className={`text-sm px-3 py-2 rounded-lg transition-all duration-300 touch-manipulation ${
                    isPreviewMode || isEditMode
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {isPreviewMode ? '返回编辑' : isEditMode ? '预览' : '编辑'}
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 touch-manipulation"
            >
              管理
            </Link>
          )}
        </div>

        {/* 移动端菜单 */}
        {showMobileMenu && isAuthenticated && (
          <div className="mobile-menu absolute top-full left-0 right-0 mt-0 sm:hidden bg-white/95 backdrop-blur-sm shadow-lg border-t border-gray-100/50 z-40 px-4 py-3 space-y-2">
            {isEditMode && !isPreviewMode && (
              <>
                <button
                  onClick={() => { setFormData({ title: '', description: '', link: '', image: '' }); setShowForm(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  添加作品
                </button>
                <button
                  onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  设置
                </button>
                <button
                  onClick={() => { setShowThemeMenu(!showThemeMenu); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  主题
                </button>
                <button
                  onClick={() => { setShowBatchMenu(!showBatchMenu); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  批量
                </button>
                {/* 移动端批量下拉菜单 */}
                {showBatchMenu && (
                  <div className="pl-4 pr-2 pb-2 space-y-1">
                    <button
                      onClick={() => { setShowBatch(true); setShowBatchMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      批量导入
                    </button>
                    <button
                      onClick={() => { handleExport('json'); setShowBatchMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      导出 JSON
                    </button>
                    <button
                      onClick={() => { handleExport('text'); setShowBatchMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      导出 TXT
                    </button>
                    <div className="h-px bg-gray-200 my-2" />
                    <div className="px-4 py-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">数据库备份</p>
                    </div>
                    <button
                      onClick={() => { handleBackup('json'); setShowBatchMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      备份 JSON
                    </button>
                    <button
                      onClick={() => { handleBackup('sql'); setShowBatchMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      备份 SQL
                    </button>
                  </div>
                )}
                <button
                  onClick={() => { setShowEmbed(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  嵌入
                </button>
              </>
            )}
            <button
              onClick={async () => {
                try { await fetch('/api/auth/logout', { method: 'DELETE' }); } catch {}
                setIsAuthenticated(false);
                setIsEditMode(false);
                setIsPreviewMode(false);
                window.location.href = '/';
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              退出
            </button>
          </div>
        )}
      </nav>

      {/* 编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingWork ? '编辑作品' : '添加作品'}
            </h2>
            <form onSubmit={editingWork ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="输入标题"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入描述"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">链接（可选）</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                  placeholder="输入链接"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图片（可选）</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  placeholder="输入图片地址"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
                >
                  {editingWork ? '更新' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingWork(null); setFormData({ title: '', description: '', link: '', image: '' }); }}
                  className="px-6 py-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white border border-gray-100/50 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 网站设置模态框 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-medium text-gray-900 mb-4">网站设置</h2>
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">站名</label>
                <input
                  type="text"
                  value={configData.site_name}
                  onChange={e => setConfigData({ ...configData, site_name: e.target.value })}
                  placeholder="输入站名"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                <input
                  type="text"
                  value={configData.site_slogan}
                  onChange={e => setConfigData({ ...configData, site_slogan: e.target.value })}
                  placeholder="输入Slogan"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO 标题</label>
                <input
                  type="text"
                  value={configData.seo_title}
                  onChange={e => setConfigData({ ...configData, seo_title: e.target.value })}
                  placeholder="网页标题（可选）"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO 描述</label>
                <textarea
                  value={configData.seo_description}
                  onChange={e => setConfigData({ ...configData, seo_description: e.target.value })}
                  placeholder="网页描述（可选）"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版权信息</label>
                <input
                  type="text"
                  value={configData.copyright_text}
                  onChange={e => setConfigData({ ...configData, copyright_text: e.target.value })}
                  placeholder="如：© 2026 7喵仓库（留空则自动显示站名）"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5">显示在页脚底部，留空自动显示「© {new Date().getFullYear()} 站名」</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">卡片列数</label>
                <div className="flex gap-2">
                  {([
                    { value: 'auto' as const, label: '自动', desc: '根据数量智能选择' },
                    { value: '2' as const, label: '2 列', desc: '固定两列布局' },
                    { value: '3' as const, label: '3 列', desc: '固定三列布局' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConfigData({ ...configData, layout_cols: opt.value })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                        configData.layout_cols === opt.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {configData.layout_cols === 'auto'
                    ? `自动模式：当前 ${works.length} 个作品 → ${actualCols} 列`
                    : configData.layout_cols === '2'
                    ? '固定两列，适合双数作品'
                    : '固定三列，适合三的倍数作品'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white border border-gray-100/50 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 批量导入模态框 */}
      {showBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-medium text-gray-900 mb-2">批量导入</h2>
            <p className="text-sm text-gray-500 mb-4">支持 JSON 和 TXT 格式，可直接粘贴或拖拽文件</p>
            <form onSubmit={handleImport} className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed transition-all duration-200 ${
                  isDragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="file-upload"
                />
                {!importText && (
                  <div className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 mb-3 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {isDragging ? '释放文件以上传' : '拖拽文件到此处，或点击选择文件'}
                    </p>
                    <p className="text-xs text-gray-400">支持 .json 和 .txt 格式</p>
                  </div>
                )}
                {importText && (
                  <div className="relative">
                    <textarea
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                      placeholder="粘贴 JSON 或 TXT 格式内容..."
                      rows={10}
                      className="w-full px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all resize-none font-mono text-sm bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setImportText('')}
                      className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">支持的格式：</p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">JSON：</span>[{`{title, description, link, image}`}, ...]
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">TXT：</span>标题 | 描述 | 链接 | 图片（每行一个）
                </p>
              </div>
              <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={clearImageOnImport}
                  onChange={e => setClearImageOnImport(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">导入时清空所有作品的 Image</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
                >
                  导入
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBatch(false); setImportText(''); }}
                  className="px-6 py-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white border border-gray-100/50 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 嵌入代码模态框 */}
      {showEmbed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">嵌入代码</h2>
            <div className="space-y-4">
              {/* 参数选择器 */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-medium text-gray-700">自定义参数</h3>
                
                {/* 列数 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">列数</label>
                  <div className="flex gap-1">
                    {[
                      { value: 'auto', label: '自动' },
                      { value: '1', label: '1' },
                      { value: '2', label: '2' },
                      { value: '3', label: '3' },
                      { value: '4', label: '4' },
                    ].map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setEmbedCols(c.value)}
                        className={`h-9 px-2.5 rounded-lg text-sm font-medium transition-colors ${
                          embedCols === c.value
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 主题/颜色 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">卡片颜色</label>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { id: 'colorful', name: '多彩', dot: 'bg-gradient-to-r from-sky-200 via-emerald-200 to-amber-200' },
                      { id: 'neutral', name: '素灰', dot: 'bg-gray-200' },
                      { id: 'blue', name: '蓝调', dot: 'bg-blue-200' },
                      { id: 'green', name: '绿意', dot: 'bg-emerald-200' },
                      { id: 'purple', name: '紫韵', dot: 'bg-purple-200' },
                      { id: 'warm', name: '暖阳', dot: 'bg-amber-200' },
                      { id: 'dark', name: '暗夜', dot: 'bg-gray-700' },
                      { id: 'ocean', name: '海洋', dot: 'bg-cyan-200' },
                      { id: 'sunset', name: '日落', dot: 'bg-orange-200' },
                      { id: 'neon', name: '霓虹', dot: 'bg-pink-200' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setEmbedTheme(t.id)}
                        className={`h-9 px-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          embedTheme === t.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                        <span className="hidden sm:inline">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 高度 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">高度</label>
                  <div className="flex gap-1">
                    {[
                      { value: 0, label: '自动' },
                      { value: 400, label: '400' },
                      { value: 600, label: '600' },
                      { value: 800, label: '800' },
                      { value: 1000, label: '1000' },
                    ].map((h) => (
                      <button
                        key={h.value}
                        onClick={() => setEmbedHeight(h.value)}
                        className={`h-9 px-2.5 rounded-lg text-sm font-medium transition-colors ${
                          embedHeight === h.value
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 间距 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">卡片间距</label>
                  <div className="flex gap-1">
                    {[{ v: '3', l: '紧凑' }, { v: '6', l: '标准' }, { v: '8', l: '宽松' }].map(({ v, l }) => (
                      <button
                        key={v}
                        onClick={() => setEmbedGap(v)}
                        className={`h-9 px-2.5 rounded-lg text-sm font-medium transition-colors ${
                          embedGap === v
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 显示选项 */}
                <div className="flex items-center gap-6 flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedShowHeader}
                      onChange={(e) => setEmbedShowHeader(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    显示标题
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedShowFooter}
                      onChange={(e) => setEmbedShowFooter(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    显示页脚
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>数量上限</span>
                    <select
                      value={embedLimit}
                      onChange={(e) => setEmbedLimit(Number(e.target.value))}
                      className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value={0}>全部</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={6}>6</option>
                      <option value={8}>8</option>
                      <option value={10}>10</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* iframe 代码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">iframe 嵌入</label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={embedIframeCode}
                    rows={8}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 font-mono text-sm resize-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(embedIframeCode);
                      alert('已复制到剪贴板');
                    }}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    复制
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">主题: {embedTheme} | 列数: {embedCols === 'auto' ? '自动适配' : embedCols} | 高度: {embedHeight > 0 ? `${embedHeight}px` : '自动'} | 数量: {embedLimit > 0 ? `前${embedLimit}个` : '全部'}</p>
              </div>
              
              {/* API JSON */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API JSON</label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={`fetch('${typeof window !== 'undefined' ? window.location.origin : ''}/api/works/embed')\n  .then(res => res.json())\n  .then(data => console.log(data));`}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 font-mono text-sm resize-none"
                  />
                  <button
                    onClick={() => {
                      const code = `fetch('${typeof window !== 'undefined' ? window.location.origin : ''}/api/works/embed')\n  .then(res => res.json())\n  .then(data => console.log(data));`;
                      navigator.clipboard.writeText(code);
                      alert('已复制到剪贴板');
                    }}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    复制
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">使用自定义样式时，获取 JSON 数据后自行渲染</p>
              </div>
              <button
                onClick={() => setShowEmbed(false)}
                className="w-full py-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white border border-gray-100/50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容 */}
      <main className="flex-1 px-4 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 max-w-3xl mx-auto">
            {isEditMode ? (
              <div className="space-y-4">
                <p>暂无作品</p>
                <button
                  onClick={() => { setFormData({ title: '', description: '', link: '', image: '' }); setShowForm(true); }}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
                >
                  添加第一个作品
                </button>
              </div>
            ) : (
              '空空如也'
            )}
          </div>
        ) : (
          <DndClientOnly works={works} gridColsClass={gridColsClass} isEditMode={isEditMode} handleDragEnd={handleDragEnd} sensors={sensors} onEdit={(w) => { setEditingWork(w); setFormData({ title: w.title, description: w.description, link: w.link || '', image: w.image || '' }); setShowForm(true); }} onDelete={handleDelete} onPin={handlePin} />
        )}
      </main>

      {/* 页脚 */}
      <footer className="py-3 sm:py-4 px-4 sm:px-6 text-center text-[10px] sm:text-xs text-gray-400 border-t border-gray-100/50 bg-white/30 backdrop-blur-sm">
        {config.copyright_text?.trim()
          ? config.copyright_text
          : `© ${new Date().getFullYear()} ${config.site_name}`}
      </footer>
    </div>
  );
}

function DndClientOnly({ works, gridColsClass, isEditMode, handleDragEnd, sensors, onEdit, onDelete, onPin }: {
  works: Work[];
  gridColsClass: string;
  isEditMode: boolean;
  handleDragEnd: (e: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  onEdit: (work: Work) => void;
  onDelete: (id: number) => void;
  onPin: (id: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return (
      <div className={`max-w-6xl mx-auto grid ${gridColsClass} gap-3 sm:gap-4 lg:gap-6`}>
        {works.map((work, index) => (
          <StaticWorkCard
            key={work.id}
            work={work}
            index={index}
            isEditMode={isEditMode}
            isPinned={index === 0 && works.length > 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={works.map(w => w.id)}>
        <div className={`max-w-6xl mx-auto grid ${gridColsClass} gap-3 sm:gap-4 lg:gap-6`}>
          {works.map((work, index) => (
            <SortableWorkCard
              key={work.id}
              work={work}
              index={index}
              isEditMode={isEditMode}
              isPinned={index === 0 && works.length > 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function StaticWorkCard({ work, index, isEditMode, isPinned, onEdit, onDelete, onPin }: { work: Work; index: number; isEditMode: boolean; isPinned: boolean; onEdit: (work: Work) => void; onDelete: (id: number) => void; onPin: (id: number) => void }) {
  const cardColors = [
    'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700',
    'bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900 dark:to-sky-800',
    'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800',
    'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800',
    'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800',
    'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900 dark:to-rose-800',
    'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800',
    'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800',
    'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800',
    'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800',
  ];
  const cardColor = cardColors[index % cardColors.length];

  return (
    <div
      className={`group relative backdrop-blur-sm rounded-2xl p-8 ${isEditMode ? 'cursor-grab' : ''} shadow-sm hover:shadow-xl transition-all duration-300 aspect-[4/3] flex flex-col border border-white/30 hover:border-white/50 ${cardColor}`}
    >
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 min-w-0 line-clamp-2">
            {isPinned && <span className="inline-block mr-1 text-yellow-500">📌</span>}
            {work.title}
          </h3>
          {isEditMode && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); onPin(work.id); }}
                className="p-1.5 bg-white/80 hover:bg-white rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                title={isPinned ? '取消置顶' : '置顶'}
              >
                <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" /></svg>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onEdit(work); }}
                className="p-1.5 bg-white/80 hover:bg-white rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                title="编辑"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onDelete(work.id); }}
                className="p-1.5 bg-white/80 hover:bg-red-50 rounded-lg text-gray-700 hover:text-red-600 transition-colors"
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>
        {work.description && (
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 mb-2 flex-shrink-0">{work.description}</p>
        )}
        {work.link && (
          <a
            href={work.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors mt-auto"
          >
            <span className="truncate max-w-[180px]">{work.link.replace(/^https?:\/\//, '')}</span>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        )}
      </div>
    </div>
  );
}
