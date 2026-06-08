import Link from "next/link";

const links = [
  { href: "/", label: "达人看板" },
  { href: "/import", label: "数据导入" },
];

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Meitu JP KOL Hub</p>
            <p className="text-xs text-zinc-500">日本达人合作资源库</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
