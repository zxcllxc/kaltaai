"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/lib/store";
import { money, sellThrough } from "@/lib/analytics";
import { human, humanWd } from "@/lib/dates";
import { NO_WHATIF } from "@/lib/types";
import { BalanceChart } from "./chart";
import { CashEditor } from "./cash";

export function Forecast() {
  const { a, base, wi, setWi, t, lang } = useApp();
  if (!a || !base) return null;
  const changed = wi.deadDiscount || wi.delayDays || wi.priceUp;
  const sc = [
    { name: "Пессимистичный", hint: "выручка −15%", gap: a.gapPess, end: a.forecast.pess[13].balance, color: "text-orange-600" },
    { name: "Базовый", hint: "как последние 4 недели", gap: a.gap, end: a.forecast.base[13].balance, color: "text-emerald-600" },
    { name: "Оптимистичный", hint: "выручка +10%", gap: a.gapOpt, end: a.forecast.opt[13].balance, color: "text-blue-600" },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.forecast}</h1>
      <Card>
        <CardContent className="space-y-3">
          <BalanceChart base={a.forecast.base} pess={a.forecast.pess} opt={a.forecast.opt} compare={changed ? base.forecast.base : undefined} reserve={a.reserve} />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <Legend c="bg-emerald-600" l="базовый" />
            <Legend c="bg-orange-500" l="пессимистичный" />
            <Legend c="bg-blue-500" l="оптимистичный" />
            {changed ? <Legend c="bg-slate-400" l="без изменений" /> : null}
          </div>
          <CashEditor />
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-3">
        {sc.map((s) => (
          <Card key={s.name} size="sm">
            <CardContent>
              <div className={`font-semibold ${s.color}`}>{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.hint}</div>
              <div className="mt-2 text-sm">
                {s.gap ? (
                  <>
                    Разрыв <b>{human(s.gap.date, lang)}</b>: <b className="text-red-600 tabular-nums">−{money(s.gap.shortfall)}</b>
                  </>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400">Разрыва нет</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">Через 14 дн.: {money(s.end)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-tour="whatif">
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Что если…</div>
              <div className="text-xs text-muted-foreground">Двигайте ползунки — прогноз и «найденные ₸» пересчитываются сразу</div>
            </div>
            {changed ? (
              <button className="text-sm text-muted-foreground underline" onClick={() => setWi(NO_WHATIF)}>
                сбросить
              </button>
            ) : null}
          </div>
          <Knob
            label="Скидка на залежавшийся товар"
            value={wi.deadDiscount * 100}
            max={60}
            step={5}
            fmt={(v) => `${v}%`}
            onChange={(v) => setWi({ ...wi, deadDiscount: v / 100 })}
            note={
              base.dead.length
                ? wi.deadDiscount
                  ? `Вернёт ≈ ${money(base.dead.reduce((s, d) => s + d.stockQty * d.retail, 0) * (1 - wi.deadDiscount) * sellThrough(wi.deadDiscount))} за неделю (продастся ~${Math.round(sellThrough(wi.deadDiscount) * 100)}%)`
                  : "Чем больше скидка, тем быстрее уйдёт остаток"
                : "Залежавшегося товара нет"
            }
          />
          <Knob
            label={`Перенести платёж${a.largestPayment ? ` «${a.largestPayment.name}»` : ""}`}
            value={wi.delayDays}
            max={14}
            step={1}
            fmt={(v) => `${v} дн.`}
            onChange={(v) => setWi({ ...wi, delayDays: v })}
            note={a.largestPayment ? `${money(a.largestPayment.amount)}, по плану ${humanWd(a.largestPayment.due, lang)}` : "Крупных платежей в окне нет"}
          />
          <Knob
            label="Поднять цены"
            value={wi.priceUp * 100}
            max={15}
            step={1}
            fmt={(v) => `+${v}%`}
            onChange={(v) => setWi({ ...wi, priceUp: v / 100 })}
            note="Допущение: при +10% цены продажи падают на 5% в штуках"
          />
          {changed ? (() => {
            const back = a.forecast.base.reduce((s, d) => s + d.inflow - d.purchases, 0) - base.forecast.base.reduce((s, d) => s + d.inflow - d.purchases, 0);
            const lp = a.largestPayment;
            const out = lp && wi.delayDays > 0 && !a.forecast.base.some((d) => d.events.some((e) => e.name === lp.name));
            return (
              <div className="rounded-lg bg-emerald-500/10 p-3 text-sm space-y-1">
                {back > 0 && <div>Вернёте в оборот за 14 дней: <b className="text-emerald-700 dark:text-emerald-400">{money(back)}</b></div>}
                {base.gap && a.gap?.shortfall !== base.gap.shortfall && <div>Разрыв меньше на <b>{money(base.gap.shortfall - (a.gap?.shortfall ?? 0))}</b></div>}
                {out && <div className="text-xs text-amber-700 dark:text-amber-300">⚠️ Перенесённый платёж ушёл за горизонт 14 дней — деньги на него всё равно понадобятся.</div>}
              </div>
            );
          })() : null}
          <div className="rounded-lg bg-muted p-3 text-sm grid grid-cols-2 gap-2">
            <div>
              Разрыв:{" "}
              <b className={a.gap ? "text-red-600" : "text-emerald-600"}>{a.gap ? `−${money(a.gap.shortfall)}` : "нет ✓"}</b>
              {base.gap && changed ? <div className="text-xs text-muted-foreground">было −{money(base.gap.shortfall)}</div> : null}
            </div>
            <div>
              Через 14 дней: <b>{money(a.forecast.base[13].balance)}</b>
              {changed ? <div className="text-xs text-muted-foreground">было {money(base.forecast.base[13].balance)}</div> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="font-semibold mb-2">По дням</div>
          <div className="divide-y text-sm">
            {a.forecast.base.map((d) => (
              <div key={d.date} className="py-1.5 flex items-center gap-2">
                <div className="w-24 text-muted-foreground">{humanWd(d.date, lang)}</div>
                <div className="flex-1 text-xs text-muted-foreground truncate">{d.events.map((e) => `${e.name} −${money(e.amount)}`).join(", ")}</div>
                <div className={`tabular-nums font-medium ${d.balance < 0 ? "text-red-600" : ""}`}>{money(d.balance)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Разрыв — день, когда остаток опускается ниже неприкосновенного резерва {money(a.reserve)} (налог + 7 дней фиксированных расходов; жёлтая линия). Как считаем: средняя выручка по дням недели за последние 4 недели; закупки — в той же доле от выручки ({Math.round(a.purchaseRatio * 100)}%); плюс платежи из календаря.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`size-2.5 rounded-full ${c}`} /> {l}
    </span>
  );
}

function Knob({ label, value, max, step, fmt, onChange, note }: { label: string; value: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void; note: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm gap-2">
        <span>{label}</span>
        <b className="tabular-nums shrink-0">{fmt(Math.round(value))}</b>
      </div>
      <Slider value={[value]} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} />
      <div className="text-xs text-muted-foreground">{note}</div>
    </div>
  );
}
