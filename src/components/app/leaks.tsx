"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { WD_KZ, WD_RU, weekdayFull } from "@/lib/dates";
import { dn } from "@/lib/demo";
import { cap } from "@/lib/texts";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function Leaks() {
  const { a, t, lang } = useApp();
  if (!a) return null;
  const maxWd = Math.max(...a.wdAvg, 1);
  const withMargin = a.items.filter((i) => i.marginPct != null && i.revenue > 0).sort((x, y) => x.marginPct! - y.marginPct!);
  const wd = lang === "kz" ? WD_KZ : WD_RU;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.leaksTitle}</h1>

      <Card>
        <CardContent className="space-y-2">
          <Head title={t.deadTitle} sum={a.frozenTotal} sub={t.deadSub} />
          {!a.hasStock && <p className="text-sm text-muted-foreground">{t.noPurchases}</p>}
          {a.hasStock && !a.dead.length && <p className="text-sm text-muted-foreground">{t.noDeadStock}</p>}
          {a.dead.map((d) => (
            <div key={d.name} className="flex items-start justify-between gap-3 text-sm border-t pt-2">
              <div className="min-w-0">
                <div className="font-medium break-words">{dn(d.name, lang)}</div>
                <div className="text-xs text-muted-foreground">{t.deadLine(d.stockQty, d.daysNoSale)}</div>
              </div>
              <b className="tabular-nums shrink-0">{money(d.frozen)}</b>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <Head title={t.weakTitle} sum={a.weak?.lossMonth ?? 0} sub={t.weakSub} />
          <div className="flex items-end gap-1.5 h-32" role="img" aria-label={t.weakTitle}>
            {ORDER.map((i) => {
              const v = a.wdAvg[i];
              const weak = a.weak?.wd === i;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="text-[10px] tabular-nums text-muted-foreground">{Math.round(v / 1000)}k</div>
                  <div className={`w-full rounded-t ${weak ? "bg-red-600" : "bg-emerald-600/70"}`} style={{ height: `${(v / maxWd) * 100}%` }} />
                  <div className={`text-xs ${weak ? "font-bold text-red-700 dark:text-red-400" : ""}`}>{wd[i]}</div>
                </div>
              );
            })}
          </div>
          {a.weak ? <p className="text-sm">{t.weakLine(cap(weekdayFull(a.weak.wd, lang)), money(a.weak.avg), money(a.weak.median), Math.round(a.weak.dropPct * 100))}</p> : <p className="text-sm text-muted-foreground">{t.noWeak}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <Head title={t.riseTitle} sum={a.riseTotal} sub={t.riseSub} />
          {!a.rises.length && <p className="text-sm text-muted-foreground">{t.noRise}</p>}
          {a.rises.map((r) => (
            <div key={r.supplier} className="border-t pt-2 text-sm">
              <div className="flex justify-between gap-2">
                <b className="break-words">{dn(r.supplier, lang)}</b>
                <span className="text-red-700 dark:text-red-400 font-semibold shrink-0">+{Math.round(r.pct * 100)}%</span>
              </div>
              {r.items.map((i) => (
                <div key={i.name} className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <span className="break-words">{dn(i.name, lang)}</span>
                  <span className="tabular-nums shrink-0">
                    {money(i.oldCost)} → {money(i.newCost)}
                  </span>
                </div>
              ))}
              <div className="text-xs mt-1">{t.overpay(money(r.overpayMonth))}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-semibold">{t.abcTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.abcSub}</p>
          {!a.hasItems && <p className="text-sm text-muted-foreground">{t.noItems}</p>}
          <div className="text-sm divide-y">
            {a.items
              .filter((i) => i.revenue > 0)
              .map((i) => (
                <div key={i.name} className="grid grid-cols-[1.5rem_1fr_auto_auto] items-start gap-2 py-1.5">
                  <span className={`w-6 text-center rounded text-xs font-bold ${i.abc === "A" ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300" : i.abc === "B" ? "bg-blue-500/20 text-blue-800 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}>{i.abc}</span>
                  <span className="min-w-0 break-words">{dn(i.name, lang)}</span>
                  <span className="text-xs text-muted-foreground w-9 text-right">{Math.round(i.share * 100)}%</span>
                  <span className="tabular-nums w-24 text-right">{money(i.revenue)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-semibold">{t.marginTitle}</h2>
          {!withMargin.length && <p className="text-sm text-muted-foreground">{t.marginNeed}</p>}
          <div className="text-sm divide-y">
            {withMargin.map((i) => (
              <div key={i.name} className="grid grid-cols-[1fr_auto_auto] items-start gap-2 py-1.5">
                <span className="min-w-0 break-words">{dn(i.name, lang)}</span>
                <span className={`w-12 text-right font-semibold ${i.marginPct! < 0.15 ? "text-red-700 dark:text-red-400" : i.marginPct! < 0.25 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>{Math.round(i.marginPct! * 100)}%</span>
                <span className="tabular-nums w-24 text-right text-muted-foreground">{money(i.profit ?? 0)}</span>
              </div>
            ))}
          </div>
          {withMargin.length > 0 && <p className="text-xs text-muted-foreground">{t.marginNote}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Head({ title, sum, sub }: { title: string; sum: number; sub: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="text-lg font-bold tabular-nums text-red-700 dark:text-red-400 shrink-0">{money(sum)}</div>
    </div>
  );
}
