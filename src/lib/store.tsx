"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Biz, CalendarItem, Dataset, Row, WhatIf } from "./types";
import { NO_WHATIF } from "./types";
import { analyze, demoDataset, type Analysis } from "./analytics";
import { addDays, fmtDate, parseDate } from "./dates";
import { T, type Dict, type Lang } from "./texts";
import type { TaxSettings } from "./tax/kz2026";

const KEY = "findir:v1";
const BIZ_IDS: Biz[] = ["shop", "cafe", "salon", "auto"];

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
  loadDataset: (ds: Dataset) => void;
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

/** Ищем регулярные платежи в загруженных данных (аренда, зарплата, коммуналка). */
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

/** Демо-данные не храним целиком: при загрузке пересоздаём на сегодняшнюю дату (цифры от этого не меняются). */
function toStorage(s: Saved) {
  if (s.ds?.isDemo) return { ...s, ds: { isDemo: true, biz: s.ds.biz, tax: s.ds.tax } };
  return s;
}

function readStorage(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Saved;
    if (v.ds?.isDemo) v.ds = { ...demoDataset(v.ds.biz), tax: v.ds.tax };
    if (v.ds && (!Array.isArray(v.ds.rows) || !v.ds.today)) v.ds = null;
    if (v.lang !== "ru" && v.lang !== "kz") v.lang = "ru";
    if (!BIZ_IDS.includes(v.biz)) v.biz = "shop";
    v.done ??= {};
    return v;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Saved>({ ds: null, lang: "ru", done: {}, biz: "shop" });
  const [wi, setWi] = useState<WhatIf>(NO_WHATIF);
  const [ready, setReady] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    let v = readStorage();
    // ссылка вида /?demo=shop (кнопка до загрузки JS, бот, QR) — сразу открываем демо
    try {
      const u = new URL(window.location.href);
      const d = u.searchParams.get("demo") as Biz | null;
      const lang = u.searchParams.get("lang");
      if (d && BIZ_IDS.includes(d)) {
        v = { ...(v ?? { done: {}, lang: "ru", biz: d, ds: null }), biz: d, done: {}, ds: demoDataset(d) };
        u.searchParams.delete("demo");
      }
      if (lang === "kz" || lang === "ru") {
        v = { ...(v ?? { done: {}, biz: "shop", ds: null, lang }), lang };
        u.searchParams.delete("lang");
      }
      if (u.toString() !== window.location.href) window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
    } catch {}
    if (v) setS(v); // eslint-disable-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  // снимаем «загрузочный» класс только после того, как применились сохранённые язык и данные (без мигания)
  useEffect(() => {
    if (!ready) return;
    const el = document.documentElement;
    el.classList.remove("kalta-boot");
    el.dataset.ready = "1";
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      if (!s.ds) return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(toStorage(s)));
    } catch {}
  }, [s, ready]);

  useEffect(() => {
    try {
      document.documentElement.lang = s.lang === "kz" ? "kk" : "ru";
    } catch {}
  }, [s.lang]);

  const base = useMemo(() => (s.ds ? analyze(s.ds) : null), [s.ds]);
  const a = useMemo(() => (s.ds ? (wi === NO_WHATIF ? base : analyze(s.ds, wi)) : null), [s.ds, wi, base]);

  const loadDemo = useCallback((biz: Biz) => {
    setWi(NO_WHATIF);
    setS((p) => ({ ...p, biz, done: {}, ds: demoDataset(biz) }));
  }, []);

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
    loadDemo,
    loadRows: (rows, source, biz) => {
      setWi(NO_WHATIF);
      const dates = rows.map((r) => r.date).sort();
      const last = dates[dates.length - 1];
      const today = fmtDate(addDays(parseDate(last), 1));
      const sales = rows.filter((r) => r.type === "sale" && r.date >= fmtDate(addDays(parseDate(today), -30))).reduce((x, r) => x + r.amount, 0);
      setS((p) => ({
        ...p,
        biz,
        done: {},
        ds: { biz, isDemo: false, source, rows, today, cash: Math.max(0, Math.round((sales * 0.25) / 1000) * 1000), calendar: detectCalendar(rows) },
      }));
    },
    loadDataset: (ds) => {
      setWi(NO_WHATIF);
      setS((p) => ({ ...p, biz: ds.biz, done: {}, ds }));
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
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {}
    },
  };
  return <C.Provider value={ctx}>{children}</C.Provider>;
}
