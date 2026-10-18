import { analyze, demoDataset, money } from "./analytics";
import { dueDate, human, longDate } from "./dates";
import { bizName, dn } from "./demo";
import { actionText, storyText } from "./texts";
import { SITE_URL } from "./flags";
import type { Biz } from "./types";

export const BIZ: Biz[] = ["shop", "cafe", "salon", "auto"];
export type BotLang = "ru" | "kz";

/** Утренний брифинг для Telegram по демо-данным. Все числа — из analyze(), как на сайте. */
export function botBrief(biz: Biz, lang: BotLang, todayStr?: string) {
  const ds = demoDataset(biz, todayStr);
  const a = analyze(ds);
  const st = storyText(a.story, a, lang);
  const act = a.actions[0];
  const tx = a.tax;
  const link = `${SITE_URL}/?demo=${biz}${lang === "kz" ? "&lang=kz" : ""}`;
  if (lang === "kz") {
    return [
      `🌅 KaltaAI брифингі · ${longDate(a.today, "kz")}`,
      `${bizName(biz, "kz")} (демо-деректер)`,
      "",
      `💰 Бүгін бос ақша: ${money(a.story.free)}`,
      `⚠️ ${st.sentence}`,
      st.cause ? `   ${st.cause}` : "",
      `✉️ Салық конверті: қазір ${money(tx.reserve)} бөліп қойыңыз; ${dueDate(tx.dueDate, "kz")} дейін ≈ ${money(tx.reserveAtDue)}.${tx.socialNext ? ` Әлеуметтік төлем ${money(tx.socialAmount)} — ${dueDate(tx.socialNext, "kz")} дейін.` : ""}`,
      act ? `✅ Бүгін: ${actionText(act, "kz").title} → +${money(act.effect)}` : "",
      "",
      `Толығырақ: ${link}`,
    ]
      .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
      .join("\n");
  }
  return [
    `🌅 Брифинг KaltaAI · ${longDate(a.today)}`,
    `${bizName(biz)} (демо-данные)`,
    "",
    `💰 Свободно сегодня: ${money(a.story.free)}`,
    `⚠️ ${st.sentence}`,
    st.cause ? `   ${st.cause}` : "",
    `✉️ Налоговый конверт: отложить сейчас ${money(tx.reserve)}; до ${longDate(tx.dueDate)} заплатить ≈ ${money(tx.reserveAtDue)}.${tx.socialNext ? ` Соцплатежи ${money(tx.socialAmount)} — до ${human(tx.socialNext)}.` : ""}`,
    act ? `✅ Сегодня: ${actionText(act, "ru").title} → +${money(act.effect)}` : "",
    "",
    `Подробно: ${link}`,
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");
}

export const BOT_TEXT = {
  ru: {
    hello: "Здравствуйте! Я KaltaAI — ИИ-финдиректор для бизнеса Тараза.\nКаждое утро: сколько денег свободно сегодня, ближайший риск, налоговый конверт и одно действие в ₸.\n\nВыберите тип бизнеса (демо-данные):",
    pick: "Выберите тип бизнеса (демо-данные):",
    names: { shop: "🛒 Магазин", cafe: "☕ Кафе", salon: "💇 Салон", auto: "🔧 СТО" } as Record<Biz, string>,
    other: "🇰🇿 Қазақша",
    help: "Команды:\n/brief — утренний брифинг\n/start — выбрать бизнес\n\nДанные демонстрационные. Свой файл — на сайте: " + SITE_URL,
  },
  kz: {
    hello: "Сәлеметсіз бе! Мен KaltaAI — Тараз бизнесіне арналған ЖИ-қаржы директорымын.\nӘр таң сайын: бүгін қанша ақша бос, ең жақын тәуекел, салық конверті және теңгемен бір әрекет.\n\nБизнес түрін таңдаңыз (демо-деректер):",
    pick: "Бизнес түрін таңдаңыз (демо-деректер):",
    names: { shop: "🛒 Дүкен", cafe: "☕ Кафе", salon: "💇 Салон", auto: "🔧 ТҚС" } as Record<Biz, string>,
    other: "🇷🇺 Русский",
    help: "Командалар:\n/brief — таңғы брифинг\n/start — бизнесті таңдау\n\nДеректер демонстрациялық. Өз файлыңыз — сайтта: " + SITE_URL,
  },
};

export { dn };
