"use client";

import { Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useApp } from "@/lib/store";
import { bizName } from "@/lib/demo";

export function TopBar() {
  const { ds, t, lang, setLang, clear } = useApp();
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 h-14">
        <div className="size-8 rounded-lg bg-emerald-600 text-white grid place-items-center font-bold">₸</div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-semibold text-sm">KaltaAI <span className="hidden sm:inline font-normal text-muted-foreground">· ИИ-финдиректор для бизнеса Тараза</span></div>
          {ds && <div className="text-xs text-muted-foreground truncate">{ds.isDemo ? bizName(ds.biz) : ds.source}</div>}
        </div>
        {ds?.isDemo && (
          <span className="rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide" data-tour="demo-badge">
            {t.demoBadge}
          </span>
        )}
        <button className="rounded-md border px-2 py-1 text-xs font-semibold" onClick={() => setLang(lang === "ru" ? "kz" : "ru")} aria-label="Язык / Тіл">
          {lang === "ru" ? "ҚАЗ" : "РУС"}
        </button>
        <button className="rounded-md border p-1.5" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Тема">
          {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        {ds && (
          <button
            className="rounded-md border p-1.5 text-red-600"
            title={t.deleteData}
            aria-label={t.deleteData}
            onClick={() => confirm(`${t.deleteData}?`) && clear()}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </header>
  );
}
