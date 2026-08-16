import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { getAuthState } from '../api/auth/_utils';
import { getConfig } from '@/storage/database/local-store';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // 如果已经登录，直接重定向到首页
  if (await getAuthState()) {
    redirect('/');
  }

  const params = await searchParams;
  const error = params.error || '';
  let errorType: 'none' | 'wrong' | 'locked' | 'notConfigured' = 'none';
  if (error.startsWith('1')) errorType = 'wrong';
  else if (error.startsWith('locked')) errorType = 'locked';
  else if (error === 'not-configured') errorType = 'notConfigured';

  const config = await getConfig();
  const siteName = config.site_name || '7喵仓库';

  return <LoginForm errorType={errorType} siteName={siteName} />;
}
