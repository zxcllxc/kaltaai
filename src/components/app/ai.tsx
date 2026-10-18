"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";

/** Клиент ИИ: один запрос на одинаковые данные (single-flight), таймаут 12 с, при ошибке — null (шаблон). */
const inflight = new Map<string, Promise<Record<string, unknown> | null>>();

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function callAI<T = Record<string, unknown>>(mode: string, facts: unknown, question?: string, lang: "ru" | "kz" = "ru"): Promise<(T & { ai: true }) | null> {
  const key = `${mode}|${lang}|${question ?? ""}|${hash(JSON.stringify(facts))}`;
  const hit = inflight.get(key);
  if (hit) return hit as Promise<(T & { ai: true }) | null>;
  const p = (async () => {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => ctrl?.abort(), 12_000);
    try {
      const r = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, facts, question, lang }),
        signal: ctrl?.signal,
      });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.ai ? j : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();
  inflight.set(key, p);
  // вопросы чата не кешируем после ответа — их можно задать снова
  if (question) p.finally(() => inflight.delete(key));
  return p as Promise<(T & { ai: true }) | null>;
}

/** Хук: результат ИИ для mode/facts (один запрос на страницу), с заранее готовым значением для демо. */
export function useAI<T>(mode: string, facts: unknown, opts: { enabled: boolean; preset?: T | null; lang?: "ru" | "kz" }) {
  const [state, setState] = useState<{ data: T | null; loading: boolean }>({ data: opts.preset ?? null, loading: opts.enabled && !opts.preset });
  const key = JSON.stringify(facts);
  useEffect(() => {
    if (opts.preset) {
      setState({ data: opts.preset, loading: false }); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    if (!opts.enabled) {
      setState({ data: null, loading: false });
      return;
    }
    let off = false;
    setState((s) => ({ ...s, loading: true }));
    callAI<T>(mode, facts, undefined, opts.lang).then((r) => {
      if (!off) setState({ data: (r as T | null) ?? null, loading: false });
    });
    return () => {
      off = true;
    };
  }, [mode, key, opts.enabled, opts.preset, opts.lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

export function AiBadge({ ai, loading }: { ai: boolean; loading?: boolean }) {
  const { t } = useApp();
  if (loading) return <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground animate-pulse">{t.aiThinking}</span>;
  return ai ? (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
      <Sparkles className="size-3" aria-hidden /> {t.aiBadge}
    </span>
  ) : (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t.tplBadge}</span>
  );
}
