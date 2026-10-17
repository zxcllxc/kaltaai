"use client";

import { Sparkles } from "lucide-react";

export async function callAI<T = Record<string, unknown>>(mode: string, facts: unknown, question?: string): Promise<(T & { ai: true }) | null> {
  try {
    const r = await fetch("/api/advice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, facts, question }) });
    const j = await r.json();
    return j.ai ? j : null;
  } catch {
    return null;
  }
}

export function AiBadge({ ai, loading }: { ai: boolean; loading?: boolean }) {
  if (loading) return <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground animate-pulse">ИИ думает…</span>;
  return ai ? (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
      <Sparkles className="size-3" /> ИИ
    </span>
  ) : (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">шаблон</span>
  );
}
