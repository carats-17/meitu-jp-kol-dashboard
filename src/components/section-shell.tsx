import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "white" | "muted" | "rose";
  children: ReactNode;
};

const variants = {
  white: "bg-white border-zinc-200",
  muted: "bg-zinc-100/80 border-zinc-200",
  rose: "bg-rose-50/50 border-rose-100",
};

export function SectionShell({
  title,
  description,
  action,
  variant = "white",
  children,
}: Props) {
  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${variants[variant]}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-inherit pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
