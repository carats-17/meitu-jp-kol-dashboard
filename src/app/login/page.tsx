import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-semibold text-zinc-900">BeautyCam JP</p>
          <p className="mt-1 text-sm text-zinc-500">日本达人合作资源库 · 登录后使用</p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-zinc-500">加载中...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
