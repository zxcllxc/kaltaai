"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, TriangleAlert, PiggyBank, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { analyze, calibrateDemoCash, money, type Analysis } from "@/lib/analytics";
import { generateDemo } from "@/lib/demo";
import { human } from "@/lib/dates";

export default function Pitch() {
  const { loadDemo } = useApp();
  const router = useRouter();
  const [a, setA] = useState<Analysis | null>(null);
  useEffect(() => {
    setA(analyze(calibrateDemoCash(generateDemo("shop")))); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  const start = () => {
    loadDemo("shop");
    router.push("/?tour=1#home");
  };
  return (
    <main className="min-h-dvh bg-gradient-to-b from-emerald-950 via-zinc-950 to-black text-white">
      <div className="mx-auto max-w-3xl px-5 py-10 space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="size-3.5" /> Zhambyl Hub · AI for SME & Local Business
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">ИИ-финдиректор для малого бизнеса Тараза</h1>
          <p className="text-lg text-white/70">
            Владелец магазина ведёт учёт в тетради и Excel. Он видит, сколько продал вчера, — но не видит, что через 9 дней не хватит денег на оплату поставщику.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat icon={TriangleAlert} color="text-red-400" label="Кассовый разрыв найден заранее" value={a?.gap ? money(a.gap.shortfall) : "…"} sub={a?.gap ? `${human(a.gap.date)}, за ${a.gap.dayIndex} дн. до` : ""} />
          <Stat icon={PiggyBank} color="text-amber-300" label="Найдено денег" value={a ? money(a.found.total) : "…"} sub="заморожено + слабые дни + переплата" />
          <Stat icon={ShieldCheck} color="text-emerald-400" label="Предотвращённый разрыв" value={a ? money(a.prevented) : "…"} sub="2 действия, 1 звонок" />
        </div>
        <p className="text-xs text-white/50">Цифры — на демо-данных магазина (сгенерированы с заложенными проблемами, не реальный бизнес).</p>

        <Button size="lg" onClick={start} className="h-14 w-full sm:w-auto px-8 text-base bg-emerald-500 hover:bg-emerald-400 text-black">
          <Play className="size-5" /> Пройти демо за 2 минуты
        </Button>

        <div className="grid gap-4 sm:grid-cols-2 text-sm text-white/80">
          <Block t="Как работает" items={["Загрузка CSV / Excel / выгрузки Kaspi — колонки угадываются", "Код считает прогноз на 14 дней, утечки, ABC, маржу", "ИИ (NVIDIA NIM) только пишет тексты по готовым цифрам", "Данные остаются в браузере"]} />
          <Block t="Почему не блокнот" items={["Будущие платежи + средние продажи по дням недели = дата разрыва", "Каждый совет со суммой в ₸ и сроком", "Трекинг: сколько реально сэкономлено", "Казахский язык, тексты акций для WhatsApp"]} />
        </div>
        <div className="text-xs text-white/40">Дальше: интеграция с Kaspi Pay и 1С, отзывы 2ГИС через API, пилоты с 5 точками в Таразе.</div>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, color, label, value, sub }: { icon: React.ElementType; color: string; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <Icon className={`size-5 ${color}`} />
      <div className="mt-2 text-xs text-white/60">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-white/50">{sub}</div>
    </div>
  );
}

function Block({ t, items }: { t: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
      <div className="font-semibold text-white">{t}</div>
      <ul className="space-y-1 list-disc pl-4">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
