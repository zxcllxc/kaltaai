"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { parseAmount } from "@/lib/amount";

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function CashEditor() {
  const { ds, setCash, t } = useApp();
  const [v, setV] = useState(fmt(ds?.cash ?? 0));
  useEffect(() => setV(fmt(ds?.cash ?? 0)), [ds?.cash]); // eslint-disable-line react-hooks/set-state-in-effect
  if (!ds) return null;
  const commit = () => {
    const n = parseAmount(v);
    if (n != null && n >= -1e10 && n <= 1e11) setCash(n);
    else setV(fmt(ds.cash));
  };
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground flex-1">
        {t.cashLabel}
        {!ds.isDemo && t.cashCheck}
      </span>
      <input
        inputMode="numeric"
        className="w-36 rounded-md border bg-background px-2 py-1.5 text-right tabular-nums"
        value={v}
        aria-label={t.cashLabel}
        onChange={(e) => setV(e.target.value.slice(0, 20))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      <span aria-hidden>₸</span>
    </label>
  );
}
