/** Feature-флаги. Новое — только за флагом; выключить: переменная окружения = "0" и передеплой. */
export const FLAGS = {
  /** Telegram-бот: QR и ссылки на /pitch и главной */
  telegram: process.env.NEXT_PUBLIC_FLAG_TELEGRAM !== "0",
  /** Быстрый старт без файла (5 вопросов) */
  quickStart: process.env.NEXT_PUBLIC_FLAG_QUICKSTART !== "0",
  /** Голосовой ввод — выключен: в NVIDIA NIM с текущим ключом нет REST-распознавания речи */
  voice: process.env.NEXT_PUBLIC_FLAG_VOICE === "1",
  /** Фото тетради/чека через vision-модель */
  photo: process.env.NEXT_PUBLIC_FLAG_PHOTO === "1",
  /** Заранее сгенерированные ИИ-тексты для демо-профилей */
  aiCache: process.env.NEXT_PUBLIC_FLAG_AI_CACHE !== "0",
};

export const TELEGRAM_BOT = "KaltaAI_Bot";
export const SITE_URL = "https://kaltaai.vercel.app";
