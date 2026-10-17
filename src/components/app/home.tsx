"use client";

import { TriangleAlert, CheckCircle2, ChevronRight, ShieldCheck, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { human, humanWd } from "@/lib/dates";
import { BalanceChart } from "./chart";
import { useGo } from "./shell";
import { CashEditor } from "./cash";
import { ActionCard } from "./todo";
import { SUBSCRIPTION } from "./roi";
import { FreeMoney } from "./free";

export function Home() {
  const { a, ds, t, lang, done } = useApp();
  const go = useGo();
  if (!a || !ds) return null;
  const saved = Object.values(done).reduce((s, x) => s + x, 0);
  return (
    <div className="space-y-4">
      {ds.isDemo && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          {lang === "kz" ? (<>Бұл <b>демо-деректер</b>: Тараздағы бизнестің жасанды мысалы. Нақты сандарды көру үшін өз файлыңызды жүктеңіз.</>) : (<>Это <b>демо-данные</b>: сгенерированный пример бизнеса в Таразе с заложенными проблемами. Загрузите свой файл, чтобы увидеть реальные цифры.</>)}
        </div>
      )}

      <FreeMoney />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-teal-700 to-slate-800 text-white" data-tour="found">
        <CardContent className="py-2">
          <div className="text-sm opacity-90">{t.found}</div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">{money(a.found.total)}</div>
          <div className="text-sm opacity-90 mt-1">{t.foundSub}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <button onClick={() => go("leaks")} className="rounded-lg bg-white/15 p-2 text-left hover:bg-white/25">
              <div className="opacity-80">{t.frozen}</div>
              <div className="font-semibold text-sm tabular-nums">{money(a.found.frozen)}</div>
            </button>
            <button onClick={() => go("leaks")} className="rounded-lg bg-white/15 p-2 text-left hover:bg-white/25">
              <div className="opacity-80">{t.weak}</div>
              <div className="font-semibold text-sm tabular-nums">{money(a.found.weak)}</div>
            </button>
            <button onClick={() => go("leaks")} className="rounded-lg bg-white/15 p-2 text-left hover:bg-white/25">
              <div className="opacity-80">{t.rise}</div>
              <div className="font-semibold text-sm tabular-nums">{money(a.found.rise)}</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {a.gap ? (
        <button onClick={() => go("forecast")} className="w-full text-left rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex gap-3 items-start" data-tour="gap">
          <TriangleAlert className="size-6 text-red-600 shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-red-700 dark:text-red-400">
              {t.gapAt}: {humanWd(a.gap.date, lang)}
            </div>
            <div className="text-sm">
              {lang === "kz" ? "Ақша жетпейді:" : "Не хватит до"} <b className="tabular-nums">{money(a.gap.shortfall)}</b>
              {a.forecast.base[a.gap.dayIndex]?.events[0] && <> — {lang === "kz" ? "төлем" : "платёж"} «{a.forecast.base[a.gap.dayIndex].events[0].name}»</>}.
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      ) : (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex gap-3 items-center">
          <CheckCircle2 className="size-6 text-emerald-600" />
          <div className="font-medium">{t.noGap} {lang === "kz" ? "алдағы 14 күнде" : "в ближайшие 14 дней"}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3" data-tour="metrics">
        <Metric icon={ShieldCheck} label={t.prevented} value={money(a.prevented)} hint={a.prevented > 0 ? (lang === "kz" ? "1–2 қадамды орындасаңыз" : "если сделать шаги 1–2") : t.noGap} />
        <Metric icon={PiggyBank} label={t.frozenMoney} value={money(a.frozenTotal)} hint={lang === "kz" ?`${a.dead.length} тауар 30+ күн сатылмаған` : `${a.dead.length} поз. без продаж 30+ дн.`} />
      </div>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{t.forecast}</div>
            <button className="text-sm text-emerald-700 dark:text-emerald-400" onClick={() => go("forecast")}>
              {lang === "kz" ? "Толығырақ →" : "Подробно →"}
            </button>
          </div>
          <BalanceChart base={a.forecast.base} height={180} />
          <CashEditor />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{t.todo}</div>
          <button className="text-sm text-emerald-700 dark:text-emerald-400" onClick={() => go("todo")}>
            {lang === "kz" ? "Барлығы" : "Все"} {a.actions.length} →
          </button>
        </div>
        {a.actions.slice(0, 3).map((x, i) => (
          <ActionCard key={x.id} a={x} n={i + 1} compact />
        ))}
      </div>

      {saved > 0 && (
        <div className="rounded-xl bg-muted p-4 text-sm">
          Реально сэкономлено: <b>{money(saved)}</b> · окупаемость сервиса: <b>×{Math.round(saved / SUBSCRIPTION)}</b>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Данные: {human(a.from)} — {human(a.to)} ({a.days} дн.), источник: {ds.source}. Все суммы посчитаны кодом по вашим данным; ИИ только формулирует советы.
      </p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <Icon className="size-5 text-emerald-600 mb-1" />
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
