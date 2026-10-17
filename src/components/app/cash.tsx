"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

export function CashEditor() {
  const { ds, setCash, t } = useApp();
  const [v, setV] = useState(String(ds?.cash ?? 0));
  useEffect(() => setV(String(ds?.cash ?? 0)), [ds?.cash]);
  if (!ds) return null;
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground flex-1">{t.cash}{!ds.isDemo && " (уточните)"}</span>
      <input
        inputMode="numeric"
        className="w-36 rounded-md border bg-background px-2 py-1.5 text-right tabular-nums"
        value={v}
        onChange={(e) => setV(e.target.value.replace(/[^\d-]/g, ""))}
        onBlur={() => {
          const n = parseInt(v, 10);
          if (!isNaN(n)) setCash(n);
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      <span>₸</span>
    </label>
  );
}
