"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { parseAmount, parseDay } from "@/lib/amount";
import { money } from "@/lib/analytics";
import { addDays, fmtDate } from "@/lib/dates";
import { startOfToday } from "@/lib/demo";
import type { CalendarItem, Dataset, Row } from "@/lib/types";

const L = {
  ru: {
    title: "Быстрый старт: 5 вопросов",
    sub: "Без файла. Можно писать «85к», «1,2 млн», «85 тысяч».",
    cash: "1. Сколько денег сейчас (касса + Kaspi)?",
    revenue: "2. Выручка в обычный день?",
    rent: "3. Аренда в месяц и число оплаты",
    salary: "4. Зарплата в месяц и число выплаты",
    suppliers: "5. Сколько уходит на закупки в неделю?",
    big: "Ближайший крупный платёж поставщику (если есть) и дата",
    amount: "сумма",
    day: "число",
    date: "дата",
    go: "Посчитать свободные деньги",
    need: "Заполните хотя бы деньги сейчас и выручку в день.",
    check: (s: string) => `Понял как: ${s}`,
    source: "Быстрый старт (ответы владельца)",
    rentName: "Аренда",
    salaryName: "Зарплата",
    supName: "Оплата поставщику",
    buy: "Закупки",
    sales: "Выручка",
  },
  kz: {
    title: "Жылдам бастау: 5 сұрақ",
    sub: "Файлсыз. «85к», «1,2 млн», «85 мың» деп жазуға болады.",
    cash: "1. Қазір қанша ақша бар (касса + Kaspi)?",
    revenue: "2. Әдеттегі күнгі түсім?",
    rent: "3. Айлық жалға алу және төлем күні",
    salary: "4. Айлық жалақы және төлем күні",
    suppliers: "5. Аптасына сатып алуға қанша кетеді?",
    big: "Жеткізушіге ең жақын ірі төлем (болса) және күні",
    amount: "сома",
    day: "күні",
    date: "күні",
    go: "Бос ақшаны есептеу",
    need: "Кем дегенде қазіргі ақша мен күндік түсімді толтырыңыз.",
    check: (s: string) => `Былай түсіндім: ${s}`,
    source: "Жылдам бастау (иесінің жауаптары)",
    rentName: "Жалға алу",
    salaryName: "Жалақы",
    supName: "Жеткізушіге төлем",
    buy: "Сатып алу",
    sales: "Түсім",
  },
};

export function QuickStart() {
  const { lang, biz, loadDataset } = useApp();
  const l = L[lang];
  const [f, setF] = useState({ cash: "", revenue: "", rent: "", rentDay: "", salary: "", salaryDay: "", suppliers: "", big: "", bigDate: "" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const shown = (v: string) => {
    const n = parseAmount(v);
    return v && n != null ? <span className="text-xs text-muted-foreground">{l.check(money(n))}</span> : null;
  };

  function go() {
    const cash = parseAmount(f.cash);
    const revenue = parseAmount(f.revenue);
    if (cash == null || !revenue) {
      setErr(l.need);
      return;
    }
    const today = startOfToday();
    const weekly = parseAmount(f.suppliers) ?? 0;
    const rows: Row[] = [];
    // 4 недели истории со слов владельца: выручка каждый день, закупки равномерно
    for (let k = 28; k >= 1; k--) {
      const d = fmtDate(addDays(today, -k));
      rows.push({ date: d, type: "sale", item: l.sales, qty: 1, amount: revenue });
      if (weekly > 0) rows.push({ date: d, type: "purchase", item: l.buy, qty: 1, amount: weekly / 7 });
    }
    const calendar: CalendarItem[] = [];
    const rent = parseAmount(f.rent);
    if (rent) calendar.push({ id: "rent", name: l.rentName, amount: rent, kind: "rent", day: parseDay(f.rentDay) ?? 1 });
    const salary = parseAmount(f.salary);
    if (salary) calendar.push({ id: "salary", name: l.salaryName, amount: salary, kind: "salary", day: parseDay(f.salaryDay) ?? 10 });
    const big = parseAmount(f.big);
    if (big && f.bigDate) calendar.push({ id: "supplier", name: l.supName, amount: big, kind: "supplier", date: f.bigDate });
    const ds: Dataset = { biz, isDemo: false, source: l.source, rows, today: fmtDate(today), cash, calendar };
    loadDataset(ds);
  }

  const inp = "w-full rounded-md border bg-background px-3 py-2";
  return (
    <Card>
      <CardContent className="space-y-3">
        <div>
          <div className="font-semibold">{l.title}</div>
          <div className="text-xs text-muted-foreground">{l.sub}</div>
        </div>
        <label className="block space-y-1 text-sm">
          <span>{l.cash}</span>
          <input className={inp} inputMode="text" value={f.cash} onChange={set("cash")} placeholder="350к" />
          {shown(f.cash)}
        </label>
        <label className="block space-y-1 text-sm">
          <span>{l.revenue}</span>
          <input className={inp} value={f.revenue} onChange={set("revenue")} placeholder="85 тысяч" />
          {shown(f.revenue)}
        </label>
        <div className="space-y-1 text-sm">
          <span>{l.rent}</span>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <input className={inp} aria-label={l.rent + " — " + l.amount} value={f.rent} onChange={set("rent")} placeholder="150к" />
            <input className={inp} aria-label={l.rent + " — " + l.day} inputMode="numeric" value={f.rentDay} onChange={set("rentDay")} placeholder="1" />
          </div>
          {shown(f.rent)}
        </div>
        <div className="space-y-1 text-sm">
          <span>{l.salary}</span>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <input className={inp} aria-label={l.salary + " — " + l.amount} value={f.salary} onChange={set("salary")} placeholder="180к" />
            <input className={inp} aria-label={l.salary + " — " + l.day} inputMode="numeric" value={f.salaryDay} onChange={set("salaryDay")} placeholder="10" />
          </div>
          {shown(f.salary)}
        </div>
        <label className="block space-y-1 text-sm">
          <span>{l.suppliers}</span>
          <input className={inp} value={f.suppliers} onChange={set("suppliers")} placeholder="300 мың" />
          {shown(f.suppliers)}
        </label>
        <div className="space-y-1 text-sm">
          <span className="text-muted-foreground">{l.big}</span>
          <div className="grid grid-cols-[1fr_9.5rem] gap-2">
            <input className={inp} aria-label={l.big + " — " + l.amount} value={f.big} onChange={set("big")} placeholder="260к" />
            <input className={inp} aria-label={l.big + " — " + l.date} type="date" value={f.bigDate} onChange={set("bigDate")} />
          </div>
          {shown(f.big)}
        </div>
        {err && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {err}
          </p>
        )}
        <Button className="w-full" onClick={go}>
          {l.go}
        </Button>
      </CardContent>
    </Card>
  );
}
