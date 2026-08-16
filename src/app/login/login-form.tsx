'use client';

interface LoginFormProps {
  errorType: 'none' | 'wrong' | 'locked' | 'notConfigured';
  siteName: string;
}

const ERROR_MESSAGES: Record<LoginFormProps['errorType'], string> = {
  none: '',
  wrong: '❌ 密码错误，请重试',
  locked: '⏳ 尝试次数过多，请 15 分钟后再试',
  notConfigured: '⚠️ 系统未配置管理员密码，请部署者设置 ADMIN_PASSWORD 环境变量后重启',
};

export default function LoginForm({ errorType, siteName }: LoginFormProps) {
  const errorMessage = ERROR_MESSAGES[errorType];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{siteName}</h1>
          <p className="text-sm text-gray-500">管理员登录</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* 错误提示 */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/*
            原生 form POST 提交，浏览器自动处理 Set-Cookie + 303 重定向。
            不拦截 onSubmit、不用 fetch，让浏览器完整处理 Cookie / 跳转。
          */}
          <form
            method="POST"
            action="/api/auth/login"
            className="space-y-5"
          >
            <div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="管理员密码"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              进入管理
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
