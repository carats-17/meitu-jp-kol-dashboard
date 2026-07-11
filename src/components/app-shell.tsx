import { SidebarNav } from "./sidebar-nav";
import { SidebarProvider } from "./sidebar-context";
import { SidebarHeaderToggle } from "./sidebar-header-toggle";

export function AppShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[var(--background)]">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[var(--border)] bg-white/90 px-5 py-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <SidebarHeaderToggle />
                <div className="min-w-0">
                <h1 className="text-xl font-semibold text-[var(--foreground)]">{title}</h1>
                {description ? (
                  <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
                ) : null}
                </div>
              </div>
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
          </header>
          <main className="flex-1 px-5 py-5">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
