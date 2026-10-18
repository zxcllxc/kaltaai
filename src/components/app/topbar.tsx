"use client";

import { useState } from "react";
import { Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useApp } from "@/lib/store";
import { bizName } from "@/lib/demo";

/** Подтверждение удаления без window.confirm — во встроенных браузерах (Telegram, Instagram) он может не работать. */
export function DeleteButton({ compact }: { compact?: boolean }) {
  const { t, clear } = useApp();
  const [ask, setAsk] = useState(false);
  if (ask)
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/50 bg-red-500/10 px-1.5 py-1 text-xs" role="group" aria-label={t.deleteConfirm}>
        <span className="hidden sm:inline">{t.deleteConfirm}</span>
        <button className="rounded bg-red-600 px-2 py-0.5 font-semibold text-white" onClick={clear}>
          {t.yes}
        </button>
        <button className="rounded px-2 py-0.5" onClick={() => setAsk(false)}>
          {t.no}
        </button>
      </span>
    );
  return compact ? (
    <button className="rounded-md border p-1.5 text-red-600" title={t.deleteData} aria-label={t.deleteData} onClick={() => setAsk(true)}>
      <Trash2 className="size-4" aria-hidden />
    </button>
  ) : (
    <button className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white" onClick={() => setAsk(true)}>
      <Trash2 className="size-4" aria-hidden /> {t.deleteData}
    </button>
  );
}

export function TopBar() {
  const { ds, t, lang, setLang } = useApp();
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b bg-background print:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 h-14">
        <div className="size-8 shrink-0 rounded-lg bg-emerald-700 text-white grid place-items-center font-bold" aria-hidden>
          ₸
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-semibold text-sm">
            KaltaAI <span className="hidden sm:inline font-normal text-muted-foreground">· {t.tagline}</span>
          </div>
          {ds && <div className="text-[11px] leading-tight text-muted-foreground line-clamp-2">{ds.isDemo ? bizName(ds.biz, lang) : ds.source}</div>}
        </div>
        {ds?.isDemo && (
          <span className="shrink-0 rounded-full bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide" data-tour="demo-badge">
            {t.demoBadge}
          </span>
        )}
        <button className="shrink-0 rounded-md border px-2 py-1 text-xs font-semibold" onClick={() => setLang(lang === "ru" ? "kz" : "ru")} aria-label={lang === "ru" ? "ҚАЗ — қазақ тіліне ауысу" : "РУС — переключить на русский"}>
          {t.langToggle}
        </button>
        <button className="shrink-0 rounded-md border p-1.5" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={t.themeAria}>
          <Moon className="size-4 dark:hidden" aria-hidden />
          <Sun className="size-4 hidden dark:block" aria-hidden />
        </button>
        {ds && <DeleteButton compact />}
      </div>
    </header>
  );
}
