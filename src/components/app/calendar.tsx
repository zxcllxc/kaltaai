"use client";

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { humanWd, parseDate } from "@/lib/dates";
import { dn } from "@/lib/demo";
import type { CalendarItem } from "@/lib/types";

export function PaymentCalendar() {
  const { ds, a, setCalendar, lang, t } = useApp();
  if (!ds || !a) return null;
  const KINDS: { id: CalendarItem["kind"]; label: string }[] = [
    { id: "rent", label: t.kRent },
    { id: "salary", label: t.kSalary },
    { id: "tax", label: t.kTax },
    { id: "supplier", label: t.kSupplier },
    { id: "utilities", label: t.kUtilities },
    { id: "other", label: t.kOther },
  ];
  const cal = ds.calendar;
  const upd = (id: string, patch: Partial<CalendarItem>) => setCalendar(cal.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const weeks = [a.forecast.base.slice(0, 7), a.forecast.base.slice(7, 14)];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div>
            <h2 className="font-semibold">{t.upcomingTitle}</h2>
            <div className="text-xs text-muted-foreground">{t.upcomingSub}</div>
          </div>
          {weeks.map((w, wi) => {
            const danger = w.some((d) => d.balance < a.reserve);
            const pay = w.reduce((s, d) => s + d.events.reduce((x, e) => x + e.amount, 0), 0);
            return (
              <div key={wi} className={`rounded-lg border p-2 ${danger ? "border-red-500/50 bg-red-500/5" : ""}`}>
                <div className="flex justify-between gap-2 text-xs mb-1.5">
                  <b>{wi === 0 ? t.thisWeek : t.nextWeek}</b>
                  <span className={danger ? "text-red-700 dark:text-red-400 font-semibold" : "text-muted-foreground"}>
                    {danger ? t.danger : ""}
                    {t.paymentsSum(money(pay))}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {w.map((d) => (
                    <div
                      key={d.date}
                      title={d.events.map((e) => `${dn(e.name, lang)}: ${money(e.amount)}`).join("\n")}
                      className={`rounded-md p-1 text-center text-[10px] leading-tight ${d.balance < 0 ? "bg-red-700 text-white" : d.balance < a.reserve ? "bg-red-500/80 text-white" : d.events.length ? "bg-amber-400/30" : "bg-muted"}`}
                    >
                      <div className="font-semibold text-xs">{parseDate(d.date).getDate()}</div>
                      <div className="opacity-80" aria-hidden>
                        {d.events.length ? "💸" : "·"}
                      </div>
                    </div>
                  ))}
                </div>
                {w
                  .flatMap((d) => d.events.map((e) => ({ d, e })))
                  .map(({ d, e }) => (
                    <div key={d.date + e.name} className="flex justify-between gap-2 text-xs mt-1">
                      <span className="min-w-0 break-words">
                        {humanWd(d.date, lang)} · {dn(e.name, lang)}
                      </span>
                      <span className="tabular-nums shrink-0">−{money(e.amount)}</span>
                    </div>
                  ))}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div>
            <h2 className="font-semibold">{t.listTitle}</h2>
            <div className="text-xs text-muted-foreground">{t.listSub}</div>
          </div>
          {cal.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_auto] gap-2 border-t pt-3">
              <input className="rounded-md border bg-background px-2 py-1.5 text-sm" aria-label={t.listTitle} value={dn(c.name, lang)} onChange={(e) => upd(c.id, { name: e.target.value.slice(0, 80) })} />
              <button className="text-red-700 dark:text-red-400 px-2" aria-label={t.del} onClick={() => setCalendar(cal.filter((x) => x.id !== c.id))}>
                <Trash2 className="size-4" aria-hidden />
              </button>
              <div className="col-span-2 grid grid-cols-3 gap-2 text-sm">
                <select className="rounded-md border bg-background px-1 py-1.5" aria-label={t.mode} value={c.kind} onChange={(e) => upd(c.id, { kind: e.target.value as CalendarItem["kind"] })}>
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1">
                  <input
                    inputMode="numeric"
                    className="w-full min-w-0 rounded-md border bg-background px-2 py-1.5 text-right tabular-nums"
                    value={c.amount}
                    aria-label="₸"
                    onChange={(e) => upd(c.id, { amount: Math.min(1e10, Number(e.target.value.replace(/\D/g, "")) || 0) })}
                  />
                  ₸
                </label>
                {c.date ? (
                  <input type="date" className="min-w-0 rounded-md border bg-background px-1 py-1.5" aria-label={t.addOnce} value={c.date} onChange={(e) => e.target.value && upd(c.id, { date: e.target.value })} />
                ) : (
                  <label className="flex items-center gap-1 text-xs">
                    {t.everyMonth}
                    <input
                      inputMode="numeric"
                      className="w-11 rounded-md border bg-background px-1 py-1.5 text-center"
                      value={c.day ?? 1}
                      aria-label={t.dayOfMonth}
                      onChange={(e) => upd(c.id, { day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
                    />
                    {t.dayOfMonth}
                  </label>
                )}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-md border py-2 text-sm inline-flex items-center justify-center gap-1" onClick={() => setCalendar([...cal, { id: "c" + Date.now(), name: t.newMonthlyName, amount: 50000, kind: "other", day: 15 }])}>
              <Plus className="size-4" aria-hidden /> {t.addMonthly}
            </button>
            <button
              className="rounded-md border py-2 text-sm inline-flex items-center justify-center gap-1"
              onClick={() => setCalendar([...cal, { id: "c" + Date.now(), name: t.newOnceName, amount: 100000, kind: "supplier", date: a.forecast.base[5].date }])}
            >
              <Plus className="size-4" aria-hidden /> {t.addOnce}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
