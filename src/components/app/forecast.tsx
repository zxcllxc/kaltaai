"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/lib/store";
import { money, sellThrough } from "@/lib/analytics";
import { humanWd } from "@/lib/dates";
import { dn } from "@/lib/demo";
import { NO_WHATIF } from "@/lib/types";
import { q, storyShort, storyText } from "@/lib/texts";
import { BalanceChart } from "./chart-lazy";
import { CashEditor } from "./cash";

export function Forecast() {
  const { a, base, wi, setWi, t, lang } = useApp();
  if (!a || !base) return null;
  const changed = wi.deadDiscount || wi.delayDays || wi.priceUp;
  const st = storyText(a.story, a, lang);
  const sc = [
    { name: t.scPess, hint: t.scPessHint, s: a.storyPess, end: a.forecast.pess[13].balance, color: "text-orange-700 dark:text-orange-400" },
    { name: t.scBase, hint: t.scBaseHint, s: a.story, end: a.forecast.base[13].balance, color: "text-emerald-700 dark:text-emerald-400" },
    { name: t.scOpt, hint: t.scOptHint, s: a.storyOpt, end: a.forecast.opt[13].balance, color: "text-blue-700 dark:text-blue-400" },
  ];
  const lp = a.largestPayment;
  const back = a.forecast.base.reduce((s, d) => s + d.inflow - d.purchases, 0) - base.forecast.base.reduce((s, d) => s + d.inflow - d.purchases, 0);
  const delayedOut = lp && wi.delayDays > 0 && !a.forecast.base.some((d) => d.events.some((e) => e.name === lp.name));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.forecastTitle}</h1>
      <Card>
        <CardContent className="space-y-3">
          <p className="font-medium leading-snug">{st.sentence}</p>
          {st.cause && <p className="text-sm text-muted-foreground -mt-2">{st.cause}</p>}
          <BalanceChart
            base={a.forecast.base}
            pess={a.forecast.pess}
            opt={a.forecast.opt}
            compare={changed ? base.forecast.base : undefined}
            reserve={a.reserve}
            mark={a.story.kind !== "ok" && a.story.criticalIndex >= 0 ? { date: a.story.critical, label: money(-a.story.shortfall) } : null}
          />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <Legend c="bg-emerald-600" l={t.legendBase} />
            <Legend c="bg-orange-500" l={t.legendPess} />
            <Legend c="bg-blue-500" l={t.legendOpt} />
            <span className="inline-flex items-center gap-1">
              <span className="w-4 border-t-2 border-dashed border-amber-600" aria-hidden /> {t.legendReserve}
            </span>
            {changed ? <Legend c="bg-slate-400" l={t.legendWas} /> : null}
          </div>
          <p className="text-xs text-muted-foreground">{st.reserveLine}</p>
          <CashEditor />
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-3">
        {sc.map((x) => (
          <Card key={x.name} size="sm">
            <CardContent>
              <div className={`font-semibold ${x.color}`}>{x.name}</div>
              <div className="text-xs text-muted-foreground">{x.hint}</div>
              <div className="mt-2 text-sm">
                {t.freeNow}: <b className={x.s.free < 0 ? "text-red-700 dark:text-red-400" : ""}>{money(x.s.free)}</b>
              </div>
              <div className="text-sm">{storyShort(x.s, lang)}</div>
              <div className="text-xs text-muted-foreground">{t.in14(money(x.end))}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-tour="whatif">
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{t.whatIfTitle}</h2>
              <div className="text-xs text-muted-foreground">{t.whatIfSub}</div>
            </div>
            {changed ? (
              <button className="text-sm text-muted-foreground underline shrink-0" onClick={() => setWi(NO_WHATIF)}>
                {t.reset}
              </button>
            ) : null}
          </div>
          <Knob
            label={t.knobDiscount}
            value={wi.deadDiscount * 100}
            max={60}
            step={5}
            fmt={(v) => `${v}%`}
            onChange={(v) => setWi({ ...wi, deadDiscount: v / 100 })}
            note={
              base.dead.length
                ? wi.deadDiscount
                  ? t.noteDiscount(money(base.dead.reduce((s, d) => s + d.stockQty * d.retail, 0) * (1 - wi.deadDiscount) * sellThrough(wi.deadDiscount)), Math.round(sellThrough(wi.deadDiscount) * 100))
                  : t.noteDiscount0
                : t.noDead
            }
          />
          <Knob
            label={lp ? t.knobDelay(q(dn(lp.name, lang))) : t.knobDelayGeneric}
            value={wi.delayDays}
            max={14}
            step={1}
            fmt={(v) => `${v} ${t.daysUnit}`}
            onChange={(v) => setWi({ ...wi, delayDays: v })}
            note={lp ? t.noteDelay(money(lp.amount), humanWd(lp.due, lang)) : t.noBigPayments}
          />
          <Knob label={t.knobPrice} value={wi.priceUp * 100} max={15} step={1} fmt={(v) => `+${v}%`} onChange={(v) => setWi({ ...wi, priceUp: v / 100 })} note={t.notePrice} />
          {changed ? (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-sm space-y-1">
              {back > 0 && <div>{t.returns(money(back))}</div>}
              {base.story.shortfall > a.story.shortfall && <div>{t.shortfallLess(money(base.story.shortfall - a.story.shortfall))}</div>}
              {delayedOut && <div className="text-xs text-amber-800 dark:text-amber-200">{t.delayedOut}</div>}
            </div>
          ) : null}
          <div className="rounded-lg bg-muted p-3 text-sm grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              {t.freeNow}: <b className={a.story.free < 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}>{money(a.story.free)}</b>
              {changed ? <div className="text-xs text-muted-foreground">{t.was(money(base.story.free))}</div> : null}
            </div>
            <div>
              {t.in14(money(a.forecast.base[13].balance))}
              {changed ? <div className="text-xs text-muted-foreground">{t.was(money(base.forecast.base[13].balance))}</div> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-semibold mb-2">{t.byDays}</h2>
          <div className="divide-y text-sm">
            {a.forecast.base.map((d) => (
              <div key={d.date} className="py-1.5 grid grid-cols-[6.5rem_1fr_auto] items-start gap-2">
                <div className="text-muted-foreground">{humanWd(d.date, lang)}</div>
                <div className="text-xs text-muted-foreground break-words">{d.events.map((e) => `${dn(e.name, lang)} −${money(e.amount)}`).join(", ")}</div>
                <div className={`tabular-nums font-medium text-right ${d.balance < 0 ? "text-red-700 dark:text-red-400" : d.balance < a.reserve ? "text-amber-700 dark:text-amber-400" : ""}`}>{money(d.balance)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t.method(money(a.reserve), Math.round(a.purchaseRatio * 100))}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`size-2.5 rounded-full ${c}`} aria-hidden /> {l}
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
      <Slider value={[value]} max={max} step={step} aria-label={label} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} />
      <div className="text-xs text-muted-foreground">{note}</div>
    </div>
  );
}
