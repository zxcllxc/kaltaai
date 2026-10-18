"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money, type Action } from "@/lib/analytics";
import { actionText, factsForLLM } from "@/lib/texts";
import { DEMO_AI } from "@/lib/demo-ai";
import { FLAGS } from "@/lib/flags";
import { SUBSCRIPTION } from "./roi";
import { AiBadge, useAI } from "./ai";
import { cn } from "@/lib/utils";

/** Формулировки действий от ИИ: для демо — заранее готовые, для своих данных — живой запрос (один на страницу). */
export function useAiActions() {
  const { a, ds, lang } = useApp();
  const preset = ds?.isDemo && FLAGS.aiCache && lang === "ru" ? (DEMO_AI[ds.biz]?.actions ?? null) : null;
  const facts = useMemo(() => (a && ds ? factsForLLM(a, ds, "ru") : null), [a, ds]);
  const presetObj = useMemo(() => (preset ? { actions: preset } : null), [preset]);
  const r = useAI<{ actions: Record<string, string> }>("actions", facts, { enabled: !!facts && lang === "ru", preset: presetObj });
  return { ai: lang === "ru" ? (r.data?.actions ?? null) : null, loading: lang === "ru" && r.loading };
}

export function ActionCard({ a, n, compact }: { a: Action; n: number; compact?: boolean }) {
  const { lang, t, done, toggleDone } = useApp();
  const { ai, loading } = useAiActions();
  const tx = actionText(a, lang);
  const isDone = done[a.id] != null;
  const aiTitle = ai?.[a.id];
  return (
    <Card size="sm" className={cn(isDone && "opacity-70")}>
      <CardContent className="flex gap-3">
        <div className="size-7 shrink-0 rounded-full bg-emerald-700 text-white grid place-items-center text-sm font-bold" aria-hidden>
          {n}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className={cn("font-medium leading-snug", isDone && "line-through")}>{aiTitle ?? tx.title}</div>
          {!compact && <div className="text-sm text-muted-foreground">{tx.how}</div>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>
              {t.effect}: <b className="text-emerald-800 dark:text-emerald-300 tabular-nums">+{money(a.effect)}</b>
              {a.id === "supplier" || a.id === "weak" ? t.perMonth : ""}
            </span>
            <span className="text-muted-foreground">
              {t.deadline}: {a.deadlineDays} {t.days}
            </span>
            <AiBadge ai={!!aiTitle} loading={loading && !aiTitle} />
          </div>
        </div>
        <button
          onClick={() => toggleDone(a.id, a.effect)}
          className={cn("size-9 shrink-0 rounded-full border grid place-items-center", isDone ? "bg-emerald-700 border-emerald-700 text-white" : "text-muted-foreground")}
          title={t.done}
          aria-label={t.done}
          aria-pressed={isDone}
        >
          <Check className="size-4" aria-hidden />
        </button>
      </CardContent>
    </Card>
  );
}

export function Todo() {
  const { a, t, done } = useApp();
  const { ai } = useAiActions();
  if (!a) return null;
  const saved = Object.values(done).reduce((s, x) => s + x, 0);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.todoTitle}</h1>
      <div className="grid grid-cols-2 gap-3" data-tour="roi">
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground">{t.saved}</div>
            <div className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{money(saved)}</div>
            <div className="text-[11px] text-muted-foreground">{t.savedHint}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground">{t.roi}</div>
            <div className="text-xl font-bold tabular-nums">{saved ? `×${Math.round(saved / SUBSCRIPTION)}` : "—"}</div>
            <div className="text-[11px] text-muted-foreground">{t.roiHint(money(SUBSCRIPTION))}</div>
          </CardContent>
        </Card>
      </div>
      {a.actions.map((x, i) => (
        <ActionCard key={x.id} a={x} n={i + 1} />
      ))}
      <p className="text-xs text-muted-foreground">{ai ? t.footAi : t.footTpl}</p>
    </div>
  );
}
