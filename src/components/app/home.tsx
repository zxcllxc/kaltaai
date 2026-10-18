"use client";

import { ShieldCheck, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { human } from "@/lib/dates";
import { dn } from "@/lib/demo";
import { FLAGS } from "@/lib/flags";
import { storyShort } from "@/lib/texts";
import { BalanceChart } from "./chart";
import { useGo } from "./shell";
import { CashEditor } from "./cash";
import { ActionCard } from "./todo";
import { SUBSCRIPTION } from "./roi";
import { FreeMoney } from "./free";
import { TelegramCard } from "./telegram";

export function Home() {
  const { a, ds, t, lang, done } = useApp();
  const go = useGo();
  if (!a || !ds) return null;
  const saved = Object.values(done).reduce((s, x) => s + x, 0);
  return (
    <div className="space-y-4">
      {ds.isDemo && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          {t.demoBanner1}
          <b>{t.demoBanner2}</b>
          {t.demoBanner3}
        </div>
      )}

      <FreeMoney />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-teal-800 to-slate-900 text-white" data-tour="found">
        <CardContent className="py-2">
          <h2 className="text-sm font-medium opacity-95">{t.foundTitle}</h2>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">{money(a.found.total)}</div>
          <div className="text-sm opacity-90 mt-1">{t.foundSub}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {[
              [t.foundFrozen, a.found.frozen],
              [t.foundWeak, a.found.weak],
              [t.foundRise, a.found.rise],
            ].map(([l, v]) => (
              <button key={String(l)} onClick={() => go("leaks")} className="rounded-lg bg-white/15 p-2 text-left hover:bg-white/25">
                <div className="opacity-95">{l}</div>
                <div className="font-semibold text-sm tabular-nums">{money(Number(v))}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3" data-tour="metrics">
        <Metric icon={ShieldCheck} label={t.prevented} value={money(a.prevented)} hint={a.prevented > 0 ? t.preventedHint : t.noShortfall} />
        <Metric icon={PiggyBank} label={t.frozenMoney} value={money(a.frozenTotal)} hint={t.frozenHint(a.dead.length)} />
      </div>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t.forecastTitle}</h2>
            <button className="text-sm text-emerald-800 dark:text-emerald-300 shrink-0" onClick={() => go("forecast")}>
              {t.details}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{storyShort(a.story, lang)}</p>
          <BalanceChart base={a.forecast.base} height={180} reserve={a.reserve} mark={a.story.kind !== "ok" && a.story.criticalIndex >= 0 ? { date: a.story.critical, label: money(-a.story.shortfall) } : null} />
          <CashEditor />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t.todoTitle}</h2>
          <button className="text-sm text-emerald-800 dark:text-emerald-300" onClick={() => go("todo")}>
            {t.allN(a.actions.length)}
          </button>
        </div>
        {a.actions.slice(0, 3).map((x, i) => (
          <ActionCard key={x.id} a={x} n={i + 1} compact />
        ))}
      </div>

      {FLAGS.telegram && <TelegramCard />}

      {saved > 0 && <div className="rounded-xl bg-muted p-4 text-sm">{t.savedLine(money(saved), Math.round(saved / SUBSCRIPTION))}</div>}

      <p className="text-xs text-muted-foreground">{t.dataFooter(human(a.from, lang), human(a.to, lang), a.days, dn(ds.source, lang))}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <Icon className="size-5 text-emerald-700 dark:text-emerald-400 mb-1" aria-hidden />
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
