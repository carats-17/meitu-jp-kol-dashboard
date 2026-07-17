"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const HISTORY_RETURN_KEY = "history:returnTo";

export function readHistoryReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(HISTORY_RETURN_KEY);
    if (stored?.startsWith("/history")) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveHistoryReturnTo(href: string) {
  if (typeof window === "undefined") return;
  try {
    if (href.startsWith("/history")) {
      sessionStorage.setItem(HISTORY_RETURN_KEY, href);
    }
  } catch {
    /* ignore */
  }
}

function resolveFromParam(raw: string | null): string | null {
  if (!raw) return null;
  let value = raw;
  // Tolerate accidental double-encoding from Link/href construction
  for (let i = 0; i < 2; i++) {
    if (!(value.startsWith("%2F") || value.startsWith("%2f"))) break;
    try {
      value = decodeURIComponent(value);
    } catch {
      return null;
    }
  }
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function KolDetailBackLink() {
  const searchParams = useSearchParams();
  const fromParam = resolveFromParam(searchParams.get("from"));
  const href = useMemo(() => {
    if (fromParam) return fromParam;
    return readHistoryReturnTo() ?? "/history";
  }, [fromParam]);

  const isHistory = href.startsWith("/history");

  return (
    <Link href={href} className="text-sm text-mint-600 hover:underline">
      {isHistory ? "← 返回历史合作记录" : "← 返回达人检索"}
    </Link>
  );
}
