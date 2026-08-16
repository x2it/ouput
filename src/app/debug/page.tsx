import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthState } from "../api/auth/_utils";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  // 必须登录后才能访问调试页
  if (!(await getAuthState())) {
    redirect('/login?error=1');
  }

  const headersList = await headers();
  // 注意：不再返回 tokenValue 和 allCookies value，避免泄露
  return (
    <div style={{ fontFamily: "monospace", padding: 20, fontSize: 14, lineHeight: 1.6 }}>
      <h1>🔍 登录调试页</h1>
      <p>把这一页截图发给我，我能立刻判断问题在哪。</p>

      <h2>1. 认证状态</h2>
      <pre
        style={{ background: "#d4edda", padding: 10, borderRadius: 4 }}
      >
        {JSON.stringify({ authenticated: true, hint: "✓ 已登录" }, null, 2)}
      </pre>

      <h2>2. 当前请求信息</h2>
      <pre style={{ background: "#e2e3e5", padding: 10, borderRadius: 4 }}>
        {JSON.stringify(
          {
            host: headersList.get("host"),
            xForwardedProto: headersList.get("x-forwarded-proto"),
            xForwardedHost: headersList.get("x-forwarded-host"),
            origin: headersList.get("origin"),
            referer: headersList.get("referer"),
            userAgent: headersList.get("user-agent")?.slice(0, 80),
          },
          null,
          2,
        )}
      </pre>

      <h2>3. Cookie 状态</h2>
      <pre style={{ background: "#d1ecf1", padding: 10, borderRadius: 4 }}>
        {JSON.stringify(
          {
            note: "为安全考虑，调试页不再展示 token 明文与 cookie 内容",
            cookieCount: (headersList.get("cookie") || "").split(";").filter(Boolean).length,
          },
          null,
          2,
        )}
      </pre>

      <h2>4. 诊断结论</h2>
      <div
        style={{
          background: "#d4edda",
          padding: 12,
          borderRadius: 4,
          fontWeight: "bold",
        }}
      >
        ✅ 已登录。返回主页查看管理功能。
      </div>
    </div>
  );
}
