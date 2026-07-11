"use client";

import { useSidebar } from "./sidebar-context";

export function SidebarHeaderToggle() {
  const { collapsed, toggle, setCollapsed } = useSidebar();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className="relative z-50 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-mint-200 bg-mint-50 text-mint-700 transition hover:bg-mint-100 active:scale-95"
        aria-label={collapsed ? "展开导航" : "收起导航"}
        aria-expanded={!collapsed}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="text-xs text-mint-600 hover:underline"
        >
          展开菜单
        </button>
      )}
    </div>
  );
}
