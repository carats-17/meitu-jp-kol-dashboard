"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";

const links = [
  { href: "/", label: "达人汇总", short: "汇总" },
  { href: "/posts", label: "贴文成效", short: "贴文" },
  { href: "/themes", label: "推广主题", short: "主题" },
  { href: "/history", label: "历史合作记录", short: "历史" },
  { href: "/import", label: "数据导入", short: "导入" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className={`group relative flex shrink-0 flex-col border-r border-mint-200 bg-gradient-to-b from-mint-300 to-mint-400 text-white transition-all duration-300 ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      <div className={`border-b border-white/25 ${collapsed ? "px-2 py-4" : "px-4 py-5"}`}>
        {!collapsed && (
          <>
            <p className="text-lg font-semibold">BeautyCam JP</p>
            <p className="mt-0.5 text-xs text-white/80">日本达人合作资源库</p>
          </>
        )}
        {collapsed && <p className="text-center text-sm font-bold">BC</p>}
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white text-mint-600 shadow-sm"
                  : "text-white/90 hover:bg-white/20"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${active ? "bg-mint-400" : "bg-white/50"}`} />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`mt-auto space-y-2 border-t border-white/20 p-2 ${collapsed ? "" : ""}`}>
        <button
          type="button"
          title="退出登录"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className={`flex w-full items-center rounded-lg px-2.5 py-2 text-sm text-white/90 hover:bg-white/20 ${
            collapsed ? "justify-center" : "gap-2"
          }`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-white/50" />
          {!collapsed && <span>退出登录</span>}
        </button>
        {!collapsed && (
          <p className="rounded-lg bg-white/10 px-2 py-2 text-center text-[10px] text-white/70">
            点击左上角 ☰ 收起
          </p>
        )}
      </div>
    </aside>
  );
}
