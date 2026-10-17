"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money, type Analysis } from "@/lib/analytics";
import { human } from "@/lib/dates";
import { bizName, bizTitle } from "@/lib/demo";
import type { Dataset } from "@/lib/types";

export function healthScore(a: Analysis, ds: Dataset) {
  // 1. стабильность выручки — разброс дневной выручки за 4 недели
  const daily = new Map<string, number>();
  const from = a.forecast.base[0].date;
  for (const r of ds.rows) if (r.type === "sale" && r.date < from) daily.set(r.date, (daily.get(r.date) ?? 0) + r.amount);
  const vals = [...daily.entries()].sort().slice(-28).map(([, v]) => v);
  const mean = vals.reduce((s, x) => s + x, 0) / Math.max(1, vals.length);
  const cv = mean ? Math.sqrt(vals.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, vals.length)) / mean : 1;
  const stab = Math.round(25 * (1 - Math.min(1, cv / 0.6)));
  // 2. запас денег
  const dailyOut = (a.purchases30 + a.expenses30) / 30;
  const runway = dailyOut ? ds.cash / dailyOut : 30;
  const cash = a.gap ? Math.min(5, Math.round(runway)) : Math.round(Math.min(25, (runway / 30) * 25));
  // 3. зависимость от одного поставщика
  const bySup = new Map<string, number>();
  for (const r of ds.rows) if (r.type === "purchase") bySup.set(r.supplier || "—", (bySup.get(r.supplier || "—") ?? 0) + r.amount);
  const totalP = [...bySup.values()].reduce((s, x) => s + x, 0);
  const top = [...bySup.entries()].sort((x, y) => y[1] - x[1])[0];
  const share = totalP && top ? top[1] / totalP : 0;
  const dep = Math.round(20 * (1 - Math.max(0, (share - 0.3) / 0.7)));
  // 4. маржа
  const mar = Math.round(15 * Math.min(1, a.margin / 0.3));
  // 5. мёртвые остатки
  const ratio = a.sales30 ? a.frozenTotal / a.sales30 : 0;
  const dead = Math.round(15 * (1 - Math.min(1, ratio / 0.1)));
  const parts = [
    { name: "Стабильность выручки", score: stab, max: 25, note: `разброс по дням ${Math.round(cv * 100)}%` },
    { name: "Запас денег", score: cash, max: 25, note: a.gap ? `разрыв ${human(a.gap.date)}` : `≈ ${Math.round(runway)} дн. расходов` },
    { name: "Независимость от поставщика", score: dep, max: 20, note: top ? `${top[0]} — ${Math.round(share * 100)}% закупок` : "нет данных" },
    { name: "Маржа", score: mar, max: 15, note: `валовая ${Math.round(a.margin * 100)}%` },
    { name: "Оборачиваемость товара", score: dead, max: 15, note: `заморожено ${money(a.frozenTotal)}` },
  ];
  return { total: parts.reduce((s, p) => s + p.score, 0), parts };
}

export function Health() {
  const { a, ds } = useApp();
  if (!a || !ds) return null;
  const h = healthScore(a, ds);
  const color = h.total >= 70 ? "text-emerald-600" : h.total >= 45 ? "text-amber-600" : "text-red-600";
  return (
    <div className="space-y-3">
      <Card className="print:shadow-none print:border-0" id="passport">
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Паспорт финансового здоровья</div>
              <div className="font-semibold">{ds.isDemo ? bizName(ds.biz) : `${bizTitle(ds.biz)} · ${ds.source}`}</div>
              <div className="text-xs text-muted-foreground">
                Период: {human(a.from)} — {human(a.to)} · сформирован {human(ds.today)}
              </div>
              {ds.isDemo && <div className="mt-1 inline-block rounded bg-amber-400/30 px-1.5 text-[11px] font-semibold">ДЕМО-ДАННЫЕ — не для банка</div>}
            </div>
            <div className={`text-5xl font-bold tabular-nums ${color}`}>
              {h.total}
              <span className="text-base text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="space-y-2">
            {h.parts.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <b className="tabular-nums">
                    {p.score}/{p.max}
                  </b>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(p.score / p.max) * 100}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">{p.note}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded bg-muted p-2">
              Выручка 30 дн.<div className="font-semibold text-sm">{money(a.sales30)}</div>
            </div>
            <div className="rounded bg-muted p-2">
              Прибыль 30 дн.<div className="font-semibold text-sm">{money(a.profit30)}</div>
            </div>
            <div className="rounded bg-muted p-2">
              Деньги сейчас<div className="font-semibold text-sm">{money(ds.cash)}</div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">Оценка по 5 понятным критериям, рассчитана автоматически по загруженным данным. Не является кредитным рейтингом.</p>
        </CardContent>
      </Card>
      <Button className="w-full print:hidden" variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" /> Сохранить в PDF / распечатать
      </Button>
    </div>
  );
}
