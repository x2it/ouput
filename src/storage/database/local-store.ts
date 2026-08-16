import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 优先使用 Supabase，凭证不可用时才用本地文件
const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const DATA_FILE = path.join(DATA_DIR, 'works.json');

let supabase: SupabaseClient | null = null;
let envLoaded = false;
let useSupabase = false;

function loadEnvSync(): boolean {
  if (envLoaded) {
    return useSupabase;
  }

  try {
    // 优先使用环境变量
    if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
      useSupabase = true;
      envLoaded = true;
      return true;
    }

    // 尝试 dotenv
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dotenv = require('dotenv') as { config: () => void };
      dotenv.config();
      if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
        useSupabase = true;
        envLoaded = true;
        return true;
      }
    } catch {
      // dotenv not available
    }

    // 尝试 Python workload identity
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
      useSupabase = true;
    }
    envLoaded = true;
    return useSupabase;
  } catch {
    envLoaded = true;
    return false;
  }
}

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.COZE_SUPABASE_URL || '';
    const key = process.env.COZE_SUPABASE_ANON_KEY || '';
    
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    
    supabase = createClient(url, key);
  }
  return supabase;
}

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.COZE_SUPABASE_URL || '';
  const key = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    // ⚠️ 警告：没有 SERVICE_ROLE_KEY，回退到 anon key，可能受 RLS 限制
    if (!key && url) {
      console.warn(
        '\n⚠️  [database] COZE_SUPABASE_SERVICE_ROLE_KEY 未设置，config 相关操作可能受 RLS 限制。\n'
      );
    }
    return getSupabase();
  }
  return createClient(url, key);
}

function shouldUseSupabase(): boolean {
  return useSupabase || loadEnvSync();
}

export interface Work {
  id: number;
  title: string;
  description: string;
  link: string | null;
  image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface Config {
  site_name: string;
  site_slogan: string;
  seo_title?: string;
  seo_description?: string;
  layout_cols?: 'auto' | '2' | '3';
  copyright_text?: string;
}

// 统一默认值（用于 getConfig 兜底与本地模式初始化）
export const DEFAULT_CONFIG: Config = {
  site_name: '7喵仓库',
  site_slogan: '作品，即答案',
  copyright_text: '',
};

interface DataStore {
  works: Work[];
  config: Config;
}

// 本地文件操作
function readData(): DataStore {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { works: [], config: DEFAULT_CONFIG };
  }
}

function writeData(data: DataStore): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 统一使用 Supabase
export async function getAllWorks(): Promise<Work[]> {
  if (shouldUseSupabase()) {
    try {
      const { data, error } = await getSupabase()
        .from('works')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('Supabase getAllWorks error:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('getAllWorks failed:', err);
      throw err;
    }
  } else {
    const data = readData();
    return data.works.sort((a, b) => a.sort_order - b.sort_order);
  }
}

export async function getWork(id: number): Promise<Work | null> {
  if (shouldUseSupabase()) {
    const { data, error } = await getSupabase()
      .from('works')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  } else {
    const data = readData();
    return data.works.find(w => w.id === id) || null;
  }
}

export async function createWork(work: Omit<Work, 'id' | 'created_at' | 'updated_at'>): Promise<Work> {
  if (shouldUseSupabase()) {
    try {
      const { data, error } = await getSupabase()
        .from('works')
        .insert([work])
        .select()
        .single();
      if (error) {
        // 主键冲突（序列不同步）时，手动指定 id 重试
        if (error.code === '23505') {
          console.warn('主键冲突，尝试获取最大 id 后重试...');
          const { data: allWorks } = await getSupabase()
            .from('works')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();
          const maxId = allWorks?.id ?? 0;
          const { data: retryData, error: retryError } = await getSupabase()
            .from('works')
            .insert([{ ...work, id: maxId + 1 }])
            .select()
            .single();
          if (retryError) {
            console.error('Supabase createWork retry error:', JSON.stringify(retryError));
            throw new Error(retryError.message || 'Supabase 插入失败');
          }
          return retryData;
        }
        console.error('Supabase createWork error:', JSON.stringify(error));
        throw new Error(error.message || 'Supabase 插入失败');
      }
      return data;
    } catch (err) {
      console.error('createWork failed:', err);
      throw err;
    }
  } else {
    const data = readData();
    const maxId = data.works.reduce((max, w) => Math.max(max, w.id), 0);
    const newWork: Work = {
      ...work,
      id: maxId + 1,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    data.works.push(newWork);
    writeData(data);
    return newWork;
  }
}

export async function updateWork(id: number, updates: Partial<Work>): Promise<Work | null> {
  if (shouldUseSupabase()) {
    const { data, error } = await getSupabase()
      .from('works')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data;
  } else {
    const data = readData();
    const index = data.works.findIndex(w => w.id === id);
    if (index === -1) return null;
    data.works[index] = {
      ...data.works[index],
      ...updates,
      id: data.works[index].id,
      created_at: data.works[index].created_at,
      updated_at: new Date().toISOString(),
    };
    writeData(data);
    return data.works[index];
  }
}

export async function deleteWork(id: number): Promise<boolean> {
  if (shouldUseSupabase()) {
    const { error } = await getSupabase()
      .from('works')
      .delete()
      .eq('id', id);
    return !error;
  } else {
    const data = readData();
    const index = data.works.findIndex(w => w.id === id);
    if (index === -1) return false;
    data.works.splice(index, 1);
    writeData(data);
    return true;
  }
}

export async function clearAllWorks(): Promise<void> {
  if (shouldUseSupabase()) {
    await getSupabase().from('works').delete().neq('id', 0);
  } else {
    const data = readData();
    data.works = [];
    writeData(data);
  }
}

export async function pinWork(id: number): Promise<void> {
  if (shouldUseSupabase()) {
    // 获取当前最小 sort_order
    const { data: allWorks } = await getSupabase().from('works').select('id, sort_order').order('sort_order', { ascending: true });
    if (!allWorks || allWorks.length === 0) return;

    // 找到当前作品
    const targetWork = allWorks.find((w: { id: number; sort_order: number }) => w.id === id);
    if (!targetWork) return;

    // 如果已经是第一个，无需操作
    if (targetWork.sort_order === allWorks[0].sort_order && allWorks[0].id === id) return;

    // 将目标作品的 sort_order 设为最小值 - 1
    const minSortOrder = allWorks[0].sort_order;
    await getSupabase().from('works').update({ sort_order: minSortOrder - 1 }).eq('id', id);
  } else {
    const data = readData();
    const index = data.works.findIndex(w => w.id === id);
    if (index <= 0) return;
    const [work] = data.works.splice(index, 1);
    data.works.unshift(work);
    data.works.forEach((w, i) => { w.sort_order = i; });
    writeData(data);
  }
}

export async function reorderWorks(orderedIds: number[]): Promise<void> {
  if (shouldUseSupabase()) {
    // 并行发送所有 UPDATE 请求（比串行循环快得多）
    const updates = orderedIds.map((id, index) =>
      getSupabase()
        .from('works')
        .update({ sort_order: index })
        .eq('id', id)
    );
    await Promise.all(updates);
  } else {
    const data = readData();
    orderedIds.forEach((id, index) => {
      const work = data.works.find(w => w.id === id);
      if (work) {
        work.sort_order = index;
      }
    });
    writeData(data);
  }
}

export async function getConfig(): Promise<Config> {
  if (shouldUseSupabase()) {
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from('site_config')
        .select('*')
        .limit(1)
        .single();
      if (error || !data) {
        return DEFAULT_CONFIG;
      }
      return data;
    } catch {
      return DEFAULT_CONFIG;
    }
  } else {
    const data = readData();
    return data.config;
  }
}

export async function updateConfig(config: Config): Promise<Config> {
  if (shouldUseSupabase()) {
    const admin = getSupabaseAdmin();
    // 获取现有记录的 id
    const { data: existing } = await admin
      .from('site_config')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      const { data, error } = await admin
        .from('site_config')
        .update(config)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await admin
        .from('site_config')
        .insert([config])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  } else {
    const data = readData();
    data.config = config;
    writeData(data);
    return config;
  }
}

export async function getAllData(): Promise<{ works: Work[]; config: Config }> {
  const works = await getAllWorks();
  const config = await getConfig();
  return { works, config };
}

export async function batchImportWorks(
  items: Array<{ title: string; description: string; link: string | null; image: string | null; sort_order: number }>
): Promise<Work[]> {
  const results: Work[] = [];
  for (const item of items) {
    const work = await createWork(item);
    results.push(work);
  }
  return results;
}
