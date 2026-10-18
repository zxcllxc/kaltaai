import type { Biz } from "./types";

/** Заранее сгенерированные ИИ-тексты для демо-профилей (NVIDIA NIM), чтобы на питче всё появлялось мгновенно и одинаково.
 *  Сгенерировано scripts/gen-demo-ai.mts; числа проверены сервером (выдуманные отбрасываются), даты — плейсхолдеры {date}/{until}. */
export interface DemoAI {
  model: string;
  actions: Record<string, string>;
  brief: string[];
  promo: Record<string, { ru: string; kz: string }>;
}

export const DEMO_AI: Partial<Record<Biz, DemoAI>> = {
  "shop": {
    "model": "nvidia/nemotron-3-super-120b-a12b",
    "actions": {},
    "brief": [
      "сегодня деньги уйдут в налоговый резерв: не хватит 47 300 ₸.",
      "Мы можем покрыть недостаток, договорившись о переносе платежа на 7 дней."
    ],
    "promo": {}
  },
  "cafe": {
    "model": "",
    "actions": {},
    "brief": [],
    "promo": {}
  },
  "salon": {
    "model": "nvidia/nemotron-3-super-120b-a12b",
    "actions": {},
    "brief": [
      "Сегодня деньги уйдут в налоговый резерв: не хватит 38 900 ₸.",
      "Мы можем закрыть недостаток, договорившись о переносе платежа на 7 дней — первый шаг к стабильности."
    ],
    "promo": {}
  },
  "auto": {
    "model": "nvidia/nemotron-3-super-120b-a12b",
    "actions": {},
    "brief": [
      "сегодня деньги уйдут в налоговый резерв: не хватит 54 600 ₸.",
      "Мы можем избежать кассового разрыва, договорившись о переносе платежа на 7 дней."
    ],
    "promo": {}
  }
};
