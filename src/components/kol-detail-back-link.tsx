"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function KolDetailBackLink() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const safeFrom = from && from.startsWith("/") ? from : null;

  return (
    <Link
      href={safeFrom ?? "/history"}
      className="text-sm text-mint-600 hover:underline"
    >
      {safeFrom ? "← 返回达人检索" : "← 返回历史合作记录"}
    </Link>
  );
}
