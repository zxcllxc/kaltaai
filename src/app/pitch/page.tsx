import type { Metadata } from "next";
import { Play, Wallet, PiggyBank, ShieldCheck, Sparkles, Send, Smartphone } from "lucide-react";
import { analyze, demoDataset, money } from "@/lib/analytics";
import { DEMO_GAP_DAY } from "@/lib/demo";
import { FLAGS, SITE_URL, TELEGRAM_BOT } from "@/lib/flags";

export const metadata: Metadata = {
  title: "KaltaAI — питч для жюри",
  description: "Демо за 2 минуты: свободные деньги сегодня, нехватка через 9 дней, налоговый конверт и 3 действия в ₸.",
};

// Цифры демо не зависят от даты (см. demo.ts), поэтому считаем их на сервере на фиксированную дату.
const a = analyze(demoDataset("shop", "2026-10-18"));

export default function Pitch() {
  const tg = `https://t.me/${TELEGRAM_BOT}?start=pitch`;
  return (
    <main className="min-h-dvh bg-gradient-to-b from-emerald-950 via-zinc-950 to-black text-white">
      <div className="mx-auto max-w-3xl px-5 py-10 space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="size-3.5" aria-hidden /> Zhambyl Hub · AI for SME &amp; Local Business
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">KaltaAI — ИИ-финдиректор для бизнеса Тараза</h1>
          <p className="text-lg text-white/80">
            Владелец магазина ведёт учёт в тетради и Excel. Он видит, сколько продал вчера, — но не видит, что через {DEMO_GAP_DAY} дней после оплаты поставщику придётся тратить деньги, отложенные на налог.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat icon={Wallet} color="text-red-300" label="Свободно сегодня" value={money(a.story.free)} sub={`через ${DEMO_GAP_DAY} дней деньги уйдут в налоговый резерв`} />
          <Stat icon={PiggyBank} color="text-amber-300" label="Мы нашли" value={money(a.found.total)} sub="заморожено + слабые дни + переплата поставщику" />
          <Stat icon={ShieldCheck} color="text-emerald-300" label="Предотвращённый разрыв" value={money(a.prevented)} sub="1 звонок поставщику" />
        </div>
        <p className="text-xs text-white/60">Цифры — на демо-данных магазина (сгенерированы с заложенными проблемами, не реальный бизнес). Одинаковые в любой день: нехватка всегда через {DEMO_GAP_DAY} дней.</p>

        <a href="/?demo=shop&tour=1#home" className="inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-emerald-400 px-8 text-base font-semibold text-black hover:bg-emerald-300">
          <Play className="size-5" aria-hidden /> Пройти демо за 2 минуты
        </a>

        <div className="grid gap-4 sm:grid-cols-2 text-sm text-white/85">
          <Block
            t="Как работает"
            items={["Загрузка CSV / Excel / выгрузки Kaspi Pay — колонки угадываются (RU, KZ, EN)", "Код считает свободные деньги, прогноз на 14 дней, налоговый конверт, утечки", "ИИ (NVIDIA NIM) только пишет тексты по готовым цифрам — выдуманные числа отсекаются", "Данные остаются в браузере"]}
          />
          <Block t="Почему не блокнот" items={["Будущие платежи + налог + запас = сколько можно тратить сегодня", "Каждый совет со суммой в ₸ и сроком", "Трекинг: сколько реально сэкономлено", "Полностью на казахском и русском, посты акций для WhatsApp"]} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FLAGS.telegram && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/qr-telegram.svg" alt={`QR-код: Telegram-бот @${TELEGRAM_BOT}`} width={112} height={112} className="size-28 rounded-lg bg-white p-1.5" />
              <div className="space-y-2 text-sm">
                <div className="font-semibold">Брифинг в Telegram</div>
                <p className="text-white/75">Сканируйте — бот пришлёт утренний брифинг по демо.</p>
                <a href={tg} className="inline-flex items-center gap-1.5 rounded-md bg-[#1e6fa8] px-3 py-1.5 font-medium text-white" target="_blank" rel="noreferrer">
                  <Send className="size-4" aria-hidden /> @{TELEGRAM_BOT}
                </a>
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qr-site.svg" alt="QR-код: kaltaai.vercel.app" width={112} height={112} className="size-28 rounded-lg bg-white p-1.5" />
            <div className="space-y-2 text-sm">
              <div className="font-semibold">Открыть на телефоне</div>
              <p className="text-white/75">{SITE_URL.replace("https://", "")}</p>
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <Smartphone className="size-4" aria-hidden /> работает без установки
              </span>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/55">Дальше: интеграция с Kaspi Pay и 1С, отзывы 2ГИС через API, пилоты с 5 точками в Таразе.</div>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, color, label, value, sub }: { icon: React.ElementType; color: string; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <Icon className={`size-5 ${color}`} aria-hidden />
      <div className="mt-2 text-xs text-white/70">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-white/65">{sub}</div>
    </div>
  );
}

function Block({ t, items }: { t: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
      <h2 className="font-semibold text-white">{t}</h2>
      <ul className="space-y-1 list-disc pl-4">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
