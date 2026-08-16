import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  // 允许 coze.site 域名访问开发服务器（预览模式需要）
  allowedDevOrigins: ['*.dev.coze.site', '*.coze.site', '*.coze.cn', 'localhost'],
  // 生产构建时移除 console.log（保留 error/warn 用于错误处理）
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 开发服务器配置
  async rewrites() {
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
