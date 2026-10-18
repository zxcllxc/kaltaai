"use client";

import { Area, CartesianGrid, Line, ComposedChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Day } from "@/lib/analytics";
import { money } from "@/lib/analytics";
import { human } from "@/lib/dates";
import { dn } from "@/lib/demo";
import { useApp } from "@/lib/store";

function axisLabel(v: number, lang: "ru" | "kz") {
  const a = Math.abs(v);
  if (a >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + (lang === "kz" ? " млн" : " млн");
  if (a >= 1000) return Math.round(v / 1000) + (lang === "kz" ? " мың" : " тыс");
  return String(Math.round(v));
}

export function BalanceChart({
  base,
  pess,
  opt,
  compare,
  height = 240,
  reserve = 0,
  mark,
}: {
  base: Day[];
  pess?: Day[];
  opt?: Day[];
  compare?: Day[];
  height?: number;
  reserve?: number;
  mark?: { date: string; label: string } | null;
}) {
  const { t, lang } = useApp();
  const names: Record<string, string> = { base: t.scBase, pess: t.scPess, opt: t.scOpt, was: t.legendWas };
  const data = base.map((d, i) => ({
    date: human(d.date, lang),
    iso: d.date,
    base: Math.round(d.balance),
    pess: pess ? Math.round(pess[i].balance) : undefined,
    opt: opt ? Math.round(opt[i].balance) : undefined,
    was: compare ? Math.round(compare[i].balance) : undefined,
    ev: d.events.map((e) => dn(e.name, lang)).join(", "),
  }));
  const markPoint = mark ? data.find((d) => d.iso === mark.date) : null;
  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`${t.forecastTitle}${mark ? ": " + mark.label : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 14, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" stroke="currentColor" strokeOpacity={0.4} />
          <YAxis
            width={56}
            stroke="currentColor"
            strokeOpacity={0.4}
            tick={({ x, y, payload }) => (
              <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.75}>
                {axisLabel(Number(payload.value), lang)}
              </text>
            )}
          />
          <Tooltip
            formatter={(v, n) => [money(Number(v)), names[String(n)] ?? String(n)]}
            labelFormatter={(l, p) => {
              const ev = p?.[0]?.payload?.ev;
              return ev ? `${l} · ${ev}` : String(l);
            }}
            contentStyle={{ borderRadius: 12, fontSize: 12, background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)" }}
          />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
          {reserve > 0 && <ReferenceLine y={Math.round(reserve)} stroke="#d97706" strokeDasharray="6 3" label={{ value: t.legendReserve, position: "insideTopLeft", fontSize: 10, fill: "#d97706" }} />}
          {compare && <Line dataKey="was" stroke="#94a3b8" strokeDasharray="4 4" dot={false} strokeWidth={1.5} isAnimationActive={false} />}
          {pess && <Line dataKey="pess" stroke="#f97316" dot={false} strokeWidth={1.5} strokeDasharray="2 3" isAnimationActive={false} />}
          {opt && <Line dataKey="opt" stroke="#3b82f6" dot={false} strokeWidth={1.5} strokeDasharray="2 3" isAnimationActive={false} />}
          <Area dataKey="base" stroke="#059669" strokeWidth={2.5} fill="url(#g)" isAnimationActive={false} />
          {markPoint && <ReferenceDot x={markPoint.date} y={markPoint.base} r={5} fill="#dc2626" stroke="white" strokeWidth={2} label={{ value: mark!.label, position: "top", fontSize: 10, fill: "#dc2626" }} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
