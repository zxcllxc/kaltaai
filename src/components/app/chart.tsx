"use client";

import { Area, AreaChart, CartesianGrid, Line, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Day } from "@/lib/analytics";
import { kmoney, money } from "@/lib/analytics";
import { human } from "@/lib/dates";

export function BalanceChart({ base, pess, opt, compare, height = 240, reserve = 0 }: { base: Day[]; pess?: Day[]; opt?: Day[]; compare?: Day[]; height?: number; reserve?: number }) {
  const data = base.map((d, i) => ({
    date: human(d.date),
    base: Math.round(d.balance),
    pess: pess ? Math.round(pess[i].balance) : undefined,
    opt: opt ? Math.round(opt[i].balance) : undefined,
    was: compare ? Math.round(compare[i].balance) : undefined,
    ev: d.events.map((e) => e.name).join(", "),
  }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" stroke="currentColor" strokeOpacity={0.4} />
          <YAxis tickFormatter={(v) => kmoney(v).replace(" ₸", "")} tick={{ fontSize: 11 }} width={58} stroke="currentColor" strokeOpacity={0.4} />
          <Tooltip
            formatter={(v, n) => [money(Number(v)), n === "base" ? "Базовый" : n === "pess" ? "Пессимистичный" : n === "opt" ? "Оптимистичный" : "Без изменений"]}
            labelFormatter={(l, p) => {
              const ev = p?.[0]?.payload?.ev;
              return ev ? `${l} · ${ev}` : String(l);
            }}
            contentStyle={{ borderRadius: 12, fontSize: 12, background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)" }}
          />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
          {reserve > 0 && <ReferenceLine y={Math.round(reserve)} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: "резерв", position: "insideTopLeft", fontSize: 10, fill: "#f59e0b" }} />}
          {compare && <Line dataKey="was" stroke="#94a3b8" strokeDasharray="4 4" dot={false} strokeWidth={1.5} />}
          {pess && <Line dataKey="pess" stroke="#f97316" dot={false} strokeWidth={1.5} strokeDasharray="2 3" />}
          {opt && <Line dataKey="opt" stroke="#3b82f6" dot={false} strokeWidth={1.5} strokeDasharray="2 3" />}
          <Area dataKey="base" stroke="#059669" strokeWidth={2.5} fill="url(#g)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// re-export to keep tree-shaking simple
export { AreaChart };
