"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money, type Action } from "@/lib/analytics";
import { actionText, factsForLLM } from "@/lib/texts";
import { SUBSCRIPTION } from "./roi";
import { cn } from "@/lib/utils";

let cache: { key: string; actions: Record<string, string> | null } | null = null;

/** Тексты действий от LLM (NVIDIA NIM). Без ключа — null → шаблоны. */
export function useAiActions() {
  const { a, ds, lang } = useApp();
  const key = ds ? `${ds.biz}|${ds.source}|${ds.rows.length}|${ds.cash}` : "";
  const [ai, setAi] = useState<Record<string, string> | null>(cache?.key === key ? cache.actions : null);
  useEffect(() => {
    if (!a || !ds || lang !== "ru" || cache?.key === key) return;
    let off = false;
    fetch("/api/advice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts: factsForLLM(a, ds) }) })
      .then((r) => r.json())
      .then((j) => {
        cache = { key, actions: j.ai ? j.actions : null };
        if (!off) setAi(cache.actions);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [key, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return lang === "ru" ? ai : null;
}

export function ActionCard({ a, n, compact }: { a: Action; n: number; compact?: boolean }) {
  const { lang, t, done, toggleDone } = useApp();
  const ai = useAiActions();
  const tx = actionText(a, lang);
  const isDone = done[a.id] != null;
  return (
    <Card size="sm" className={cn(isDone && "opacity-70")}>
      <CardContent className="flex gap-3">
        <div className="size-7 shrink-0 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-bold">{n}</div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className={cn("font-medium leading-snug", isDone && "line-through")}>{ai?.[a.id] ?? tx.title}</div>
          {!compact && <div className="text-sm text-muted-foreground">{tx.how}</div>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span>
              {t.effect}: <b className="text-emerald-700 dark:text-emerald-400 tabular-nums">+{money(a.effect)}</b>
              {a.id === "supplier" || a.id === "weak" ? " / мес" : ""}
            </span>
            <span className="text-muted-foreground">
              {t.deadline}: {a.deadlineDays} {t.days}
            </span>
            {ai?.[a.id] && (
              <span className="inline-flex items-center gap-0.5 text-violet-600">
                <Sparkles className="size-3" /> ИИ
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleDone(a.id, a.effect)}
          className={cn("size-8 shrink-0 rounded-full border grid place-items-center", isDone ? "bg-emerald-600 border-emerald-600 text-white" : "text-muted-foreground")}
          title={t.done}
          aria-label={t.done}
        >
          <Check className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}

export function Todo() {
  const { a, t, done } = useApp();
  const ai = useAiActions();
  if (!a) return null;
  const saved = Object.values(done).reduce((s, x) => s + x, 0);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.todo}</h1>
      <div className="grid grid-cols-2 gap-3" data-tour="roi">
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground">Реально сэкономлено</div>
            <div className="text-xl font-bold tabular-nums text-emerald-600">{money(saved)}</div>
            <div className="text-[11px] text-muted-foreground">отмечайте ✓ выполненное</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground">Окупаемость сервиса</div>
            <div className="text-xl font-bold tabular-nums">{saved ? `×${Math.round(saved / SUBSCRIPTION)}` : "—"}</div>
            <div className="text-[11px] text-muted-foreground">при подписке {money(SUBSCRIPTION)}/мес (допущение)</div>
          </CardContent>
        </Card>
      </div>
      {a.actions.map((x, i) => (
        <ActionCard key={x.id} a={x} n={i + 1} />
      ))}
      <p className="text-xs text-muted-foreground">
        {ai ? "Формулировки — ИИ (NVIDIA NIM), " : "Формулировки — шаблоны (ИИ-ключ не подключён), "}все суммы и сроки посчитаны кодом по вашим данным.
      </p>
    </div>
  );
}
