/** Feature-флаги. Новое — только за флагом; выключить: переменная окружения = "0" и передеплой. */
export const FLAGS = {
  /** Telegram-бот: QR и ссылки на /pitch и главной */
  telegram: process.env.NEXT_PUBLIC_FLAG_TELEGRAM !== "0",
  /** Быстрый старт без файла (5 вопросов) */
  quickStart: process.env.NEXT_PUBLIC_FLAG_QUICKSTART !== "0",
  /** Голосовой ввод — выключен: в NVIDIA NIM с текущим ключом нет REST-распознавания речи */
  voice: process.env.NEXT_PUBLIC_FLAG_VOICE === "1",
  /** Фото тетради/чека через vision-модель */
  photo: process.env.NEXT_PUBLIC_FLAG_PHOTO !== "0",
  /** Заранее сгенерированные ИИ-тексты для демо-профилей */
  aiCache: process.env.NEXT_PUBLIC_FLAG_AI_CACHE !== "0",
};

export const TELEGRAM_BOT = "KaltaAI_Bot";
export const SITE_URL = "https://kaltaai.vercel.app";

/** Проверка фичи на проде до включения для всех: /?ff=photo,voice включает флаги только в этом браузере. */
export function localFlags(): string[] {
  try {
    const u = new URL(window.location.href);
    const ff = u.searchParams.get("ff");
    if (ff != null) localStorage.setItem("kalta-ff", ff);
    return (localStorage.getItem("kalta-ff") ?? "").split(",").filter(Boolean);
  } catch {
    return [];
  }
}
