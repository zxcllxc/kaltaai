import type { Biz } from "./types";

/** Заранее сгенерированные ИИ-тексты для демо-профилей (NVIDIA NIM), чтобы на питче всё появлялось мгновенно и одинаково.
 *  Сгенерировано scripts/gen-demo-ai.mts; числа проверены сервером (выдуманные отбрасываются), даты — плейсхолдеры {date}/{until}. */
export interface DemoAI {
  model: string;
  actions: Record<string, string>;
  brief: string[];
  promo: Record<string, { ru: string; kz: string }>;
}

export const DEMO_AI: Partial<Record<Biz, DemoAI>> = {};
