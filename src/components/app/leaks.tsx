"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { WD_RU } from "@/lib/dates";
import { cap } from "@/lib/texts";
import { WD_RU_FULL } from "@/lib/dates";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function Leaks() {
  const { a, t } = useApp();
  if (!a) return null;
  const maxWd = Math.max(...a.wdAvg);
  const withMargin = a.items.filter((i) => i.marginPct != null && i.revenue > 0).sort((x, y) => (x.marginPct! - y.marginPct!));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.leaks}</h1>

      <Card>
        <CardContent className="space-y-2">
          <Head title="📦 Мёртвые остатки" sum={a.frozenTotal} sub="товар без продаж 30+ дней — деньги лежат на полке" />
          {!a.hasStock && <p className="text-sm text-muted-foreground">В файле нет закупок — остатки посчитать нельзя.</p>}
          {a.hasStock && !a.dead.length && <p className="text-sm text-muted-foreground">Залежавшегося товара нет 👍</p>}
          {a.dead.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm border-t pt-2">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.stockQty} шт · без продаж {d.daysNoSale} дн.
                </div>
              </div>
              <b className="tabular-nums">{money(d.frozen)}</b>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <Head title="📉 Слабые дни недели" sum={a.weak?.lossMonth ?? 0} sub="недополученная прибыль в месяц против обычного дня" />
          <div className="flex items-end gap-1.5 h-32">
            {ORDER.map((wd) => {
              const v = a.wdAvg[wd];
              const weak = a.weak?.wd === wd;
              return (
                <div key={wd} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="text-[10px] tabular-nums text-muted-foreground">{Math.round(v / 1000)}k</div>
                  <div className={`w-full rounded-t ${weak ? "bg-red-500" : "bg-emerald-500/70"}`} style={{ height: `${maxWd ? (v / maxWd) * 100 : 0}%` }} />
                  <div className={`text-xs ${weak ? "font-bold text-red-600" : ""}`}>{WD_RU[wd]}</div>
                </div>
              );
            })}
          </div>
          {a.weak && (
            <p className="text-sm">
              {cap(WD_RU_FULL[a.weak.wd])}: в среднем {money(a.weak.avg)} против {money(a.weak.median)} в обычный день (−{Math.round(a.weak.dropPct * 100)}%).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <Head title="📈 Рост закупочных цен" sum={a.riseTotal} sub="переплата в месяц: последние 30 дней против предыдущих 30" />
          {!a.rises.length && <p className="text-sm text-muted-foreground">Заметного роста цен (больше 4%) нет.</p>}
          {a.rises.map((r) => (
            <div key={r.supplier} className="border-t pt-2 text-sm">
              <div className="flex justify-between">
                <b>{r.supplier}</b>
                <span className="text-red-600 font-semibold">+{Math.round(r.pct * 100)}%</span>
              </div>
              {r.items.map((i) => (
                <div key={i.name} className="flex justify-between text-xs text-muted-foreground">
                  <span>{i.name}</span>
                  <span className="tabular-nums">
                    {money(i.oldCost)} → {money(i.newCost)}
                  </span>
                </div>
              ))}
              <div className="text-xs mt-1">Переплата: <b>{money(r.overpayMonth)}</b> в месяц</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <div className="font-semibold">🅰️ ABC-анализ товаров</div>
          <p className="text-xs text-muted-foreground">A — 80% выручки (не допускать дефицита), B — 15%, C — 5% (кандидаты на сокращение закупок).</p>
          <div className="text-sm divide-y">
            {a.items.filter((i) => i.revenue > 0).map((i) => (
              <div key={i.name} className="flex items-center gap-2 py-1.5">
                <span className={`w-6 text-center rounded text-xs font-bold ${i.abc === "A" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : i.abc === "B" ? "bg-blue-500/20 text-blue-700 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>
                  {i.abc}
                </span>
                <span className="flex-1 truncate">{i.name}</span>
                <span className="text-xs text-muted-foreground w-12 text-right">{Math.round(i.share * 100)}%</span>
                <span className="tabular-nums w-28 text-right">{money(i.revenue)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <div className="font-semibold">💰 Маржа по товарам</div>
          {!withMargin.length && <p className="text-sm text-muted-foreground">Нужны и продажи, и закупки одного товара.</p>}
          <div className="text-sm divide-y">
            {withMargin.map((i) => (
              <div key={i.name} className="flex items-center gap-2 py-1.5">
                <span className="flex-1 truncate">{i.name}</span>
                <span className={`w-14 text-right font-semibold ${i.marginPct! < 0.15 ? "text-red-600" : i.marginPct! < 0.25 ? "text-amber-600" : "text-emerald-600"}`}>
                  {Math.round(i.marginPct! * 100)}%
                </span>
                <span className="tabular-nums w-28 text-right text-muted-foreground">{money(i.profit ?? 0)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Красным — маржа ниже 15%: проверьте цену или поставщика.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Head({ title, sum, sub }: { title: string; sum: number; sub: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="text-lg font-bold tabular-nums text-red-600 shrink-0">{money(sum)}</div>
    </div>
  );
}
