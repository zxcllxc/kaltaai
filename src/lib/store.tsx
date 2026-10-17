"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Biz, CalendarItem, Dataset, Row, WhatIf } from "./types";
import { NO_WHATIF } from "./types";
import { analyze, demoDataset, type Analysis } from "./analytics";
import { generateDemo } from "./demo";
import { addDays, fmtDate, parseDate } from "./dates";
import { T, type Dict, type Lang } from "./texts";
import type { TaxSettings } from "./tax/kz2026";

const KEY = "findir:v1";

interface Saved {
  ds: Dataset | null;
  lang: Lang;
  done: Record<string, number>; // action id → эффект ₸, отмечено «выполнено»
  biz: Biz;
}

interface Ctx extends Saved {
  t: Dict;
  a: Analysis | null;
  base: Analysis | null;
  wi: WhatIf;
  setWi: (w: WhatIf) => void;
  setLang: (l: Lang) => void;
  setBiz: (b: Biz) => void;
  loadDemo: (b: Biz) => void;
  loadRows: (rows: Row[], source: string, biz: Biz) => void;
  setCash: (n: number) => void;
  setCalendar: (c: CalendarItem[]) => void;
  setTax: (t: Partial<TaxSettings>) => void;
  toggleDone: (id: string, effect: number) => void;
  clear: () => void;
  ready: boolean;
}

const C = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(C);
  if (!c) throw new Error("no ctx");
  return c;
}

/** Ищем регулярные платежи в загруженных данных (аренда, зарплата, налоги). */
function detectCalendar(rows: Row[]): CalendarItem[] {
  const byCat = new Map<string, Row[]>();
  for (const r of rows) if (r.type === "expense" && r.category) byCat.set(r.category, [...(byCat.get(r.category) ?? []), r]);
  const kind: Record<string, CalendarItem["kind"]> = { Аренда: "rent", Зарплата: "salary", Налоги: "tax", Коммуналка: "utilities" };
  return [...byCat.entries()]
    .filter(([cat]) => cat !== "Прочее" && cat !== "Налоги" && cat !== "Комиссия") // налоги считает налоговый конверт
    .map(([cat, rs]) => {
      const last = rs.sort((a, b) => (a.date < b.date ? -1 : 1))[rs.length - 1];
      return { id: cat, name: cat, amount: Math.round(last.amount), kind: kind[cat] ?? "other", day: parseDate(last.date).getDate() };
    });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Saved>({ ds: null, lang: "ru", done: {}, biz: "shop" });
  const [wi, setWi] = useState<WhatIf>(NO_WHATIF);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as Saved;
        // демо-данные всегда «свежие» относительно сегодняшней даты
        if (v.ds?.isDemo) v.ds = { ...demoDataset(v.ds.biz, generateDemo), tax: v.ds.tax };
        setS(v);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s, ready]);

  const base = useMemo(() => (s.ds ? analyze(s.ds) : null), [s.ds]);
  const a = useMemo(() => (s.ds ? analyze(s.ds, wi) : null), [s.ds, wi]);

  const ctx: Ctx = {
    ...s,
    ready,
    t: T[s.lang],
    a,
    base,
    wi,
    setWi,
    setLang: (lang) => setS((p) => ({ ...p, lang })),
    setBiz: (biz) => setS((p) => ({ ...p, biz })),
    loadDemo: (biz) => {
      setWi(NO_WHATIF);
      setS((p) => ({ ...p, biz, done: {}, ds: demoDataset(biz, generateDemo) }));
    },
    loadRows: (rows, source, biz) => {
      setWi(NO_WHATIF);
      const last = rows.map((r) => r.date).sort().at(-1)!;
      const today = fmtDate(addDays(parseDate(last), 1));
      const sales = rows.filter((r) => r.type === "sale" && r.date >= fmtDate(addDays(parseDate(today), -30))).reduce((x, r) => x + r.amount, 0);
      setS((p) => ({
        ...p,
        biz,
        done: {},
        ds: { biz, isDemo: false, source, rows, today, cash: Math.round((sales * 0.25) / 1000) * 1000, calendar: detectCalendar(rows) },
      }));
    },
    setCash: (cash) => setS((p) => (p.ds ? { ...p, ds: { ...p.ds, cash } } : p)),
    setCalendar: (calendar) => setS((p) => (p.ds ? { ...p, ds: { ...p.ds, calendar } } : p)),
    setTax: (tax) => setS((p) => (p.ds ? { ...p, ds: { ...p.ds, tax: { ...p.ds.tax, ...tax } } } : p)),
    toggleDone: (id, effect) =>
      setS((p) => {
        const done = { ...p.done };
        if (done[id] != null) delete done[id];
        else done[id] = Math.round(effect);
        return { ...p, done };
      }),
    clear: () => {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      setWi(NO_WHATIF);
      setS((p) => ({ ds: null, lang: p.lang, done: {}, biz: p.biz }));
    },
  };
  return <C.Provider value={ctx}>{children}</C.Provider>;
}
