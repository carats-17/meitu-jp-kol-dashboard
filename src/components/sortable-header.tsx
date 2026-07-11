"use client";

import { useState } from "react";

type Props = {
  label: string;
  field: string;
  activeField: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
  align?: "left" | "right";
};

export function SortableHeader({ label, field, activeField, order, onSort, align = "left" }: Props) {
  const active = activeField === field;
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 text-xs font-medium transition hover:text-mint-700 ${
          active ? "text-mint-700" : "text-zinc-500"
        }`}
      >
        <span>{label}</span>
        <span className="inline-flex flex-col leading-none text-[9px]">
          <span className={active && order === "asc" ? "text-mint-600" : "text-zinc-300"}>▲</span>
          <span className={active && order === "desc" ? "text-mint-600" : "text-zinc-300"}>▼</span>
        </span>
      </button>
    </th>
  );
}

export function useSortState<T extends string>(defaultField: T, defaultOrder: "asc" | "desc" = "desc") {
  const [sortBy, setSortBy] = useState<T>(defaultField);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultOrder);

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field as T);
      setSortOrder("desc");
    }
  }

  return { sortBy, sortOrder, toggleSort, setSortBy, setSortOrder };
}
