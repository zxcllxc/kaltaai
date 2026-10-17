"use client";

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { humanWd, parseDate } from "@/lib/dates";
import type { CalendarItem } from "@/lib/types";

const KINDS: { id: CalendarItem["kind"]; label: string }[] = [
  { id: "rent", label: "Аренда" },
  { id: "salary", label: "Зарплата" },
  { id: "tax", label: "Налоги" },
  { id: "supplier", label: "Поставщик" },
  { id: "utilities", label: "Коммуналка" },
  { id: "other", label: "Другое" },
];

export function PaymentCalendar() {
  const { ds, a, setCalendar, lang } = useApp();
  if (!ds || !a) return null;
  const cal = ds.calendar;
  const upd = (id: string, patch: Partial<CalendarItem>) => setCalendar(cal.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const weeks = [a.forecast.base.slice(0, 7), a.forecast.base.slice(7, 14)];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div>
            <div className="font-semibold">🗓️ Ближайшие 2 недели</div>
            <div className="text-xs text-muted-foreground">Красным — дни, когда денег не хватает. Неделя с разрывом — опасная.</div>
          </div>
          {weeks.map((w, wi) => {
            const danger = w.some((d) => d.balance < 0);
            const pay = w.reduce((s, d) => s + d.events.reduce((x, e) => x + e.amount, 0), 0);
            return (
              <div key={wi} className={`rounded-lg border p-2 ${danger ? "border-red-500/50 bg-red-500/5" : ""}`}>
                <div className="flex justify-between text-xs mb-1.5">
                  <b>{wi === 0 ? "Эта неделя" : "Следующая неделя"}</b>
                  <span className={danger ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                    {danger ? "⚠️ опасно · " : ""}платежи {money(pay)}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {w.map((d) => (
                    <div
                      key={d.date}
                      title={d.events.map((e) => `${e.name}: ${money(e.amount)}`).join("\n")}
                      className={`rounded-md p-1 text-center text-[10px] leading-tight ${d.balance < 0 ? "bg-red-500 text-white" : d.events.length ? "bg-amber-400/30" : "bg-muted"}`}
                    >
                      <div className="font-semibold text-xs">{parseDate(d.date).getDate()}</div>
                      <div className="opacity-80">{d.events.length ? "💸" : "·"}</div>
                    </div>
                  ))}
                </div>
                {w.flatMap((d) => d.events.map((e) => ({ d, e }))).map(({ d, e }) => (
                  <div key={d.date + e.name} className="flex justify-between text-xs mt-1">
                    <span className="truncate">
                      {humanWd(d.date, lang)} · {e.name}
                    </span>
                    <span className="tabular-nums shrink-0 ml-2">−{money(e.amount)}</span>
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
            <div className="font-semibold">Регулярные и разовые платежи</div>
            <div className="text-xs text-muted-foreground">Суммы и даты — ваши. Ставки налогов мы не зашиваем: впишите сумму, которую платите.</div>
          </div>
          {cal.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_auto] gap-2 border-t pt-3">
              <input className="rounded-md border bg-background px-2 py-1.5 text-sm" value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} />
              <button className="text-red-600 px-2" aria-label="Удалить" onClick={() => setCalendar(cal.filter((x) => x.id !== c.id))}>
                <Trash2 className="size-4" />
              </button>
              <div className="col-span-2 grid grid-cols-3 gap-2 text-sm">
                <select className="rounded-md border bg-background px-1 py-1.5" value={c.kind} onChange={(e) => upd(c.id, { kind: e.target.value as CalendarItem["kind"] })}>
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1">
                  <input
                    inputMode="numeric"
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-right tabular-nums"
                    value={c.amount}
                    onChange={(e) => upd(c.id, { amount: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                  />
                  ₸
                </label>
                {c.date ? (
                  <input type="date" className="rounded-md border bg-background px-1 py-1.5" value={c.date} onChange={(e) => upd(c.id, { date: e.target.value })} />
                ) : (
                  <label className="flex items-center gap-1 text-xs">
                    каждое
                    <input
                      inputMode="numeric"
                      className="w-12 rounded-md border bg-background px-1 py-1.5 text-center"
                      value={c.day ?? 1}
                      onChange={(e) => upd(c.id, { day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
                    />
                    число
                  </label>
                )}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-md border py-2 text-sm inline-flex items-center justify-center gap-1"
              onClick={() => setCalendar([...cal, { id: "c" + Date.now(), name: "Новый ежемесячный платёж", amount: 50000, kind: "other", day: 15 }])}
            >
              <Plus className="size-4" /> Ежемесячный
            </button>
            <button
              className="rounded-md border py-2 text-sm inline-flex items-center justify-center gap-1"
              onClick={() => setCalendar([...cal, { id: "c" + Date.now(), name: "Оплата поставщику", amount: 100000, kind: "supplier", date: a.forecast.base[5].date }])}
            >
              <Plus className="size-4" /> Разовый
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
