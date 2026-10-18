import { createHash, timingSafeEqual } from "crypto";
import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { BIZ, BOT_TEXT, botBrief, type BotLang } from "@/lib/bot-brief";
import type { Biz } from "@/lib/types";

/** Telegram-бот KaltaAI (только демо-данные). Вебхук: POST /api/telegram с заголовком секрета. */

export const maxDuration = 20;

const token = process.env.TELEGRAM_BOT_TOKEN?.trim().replace(/\.$/, "");
/** Секрет вебхука выводится из токена — отдельная переменная окружения не нужна */
function webhookSecret(tok: string) {
  return createHash("sha256").update("kalta-webhook:" + tok).digest("hex").slice(0, 48);
}

function keyboard(lang: BotLang) {
  const t = BOT_TEXT[lang];
  const kb = new InlineKeyboard();
  BIZ.forEach((b, i) => {
    kb.text(t.names[b], `b:${b}:${lang}`);
    if (i % 2 === 1) kb.row();
  });
  kb.text(t.other, `l:${lang === "ru" ? "kz" : "ru"}`);
  return kb;
}

let handler: ((req: Request) => Promise<Response>) | null = null;

function getHandler() {
  if (handler || !token) return handler;
  const bot = new Bot(token);
  const langOf = (code?: string): BotLang => (code?.startsWith("kk") ? "kz" : "ru");

  bot.command("start", async (ctx) => {
    const p = (ctx.match ?? "").trim().toLowerCase();
    let lang = langOf(ctx.from?.language_code);
    if (p === "kz") lang = "kz";
    if ((BIZ as string[]).includes(p)) {
      await ctx.reply(botBrief(p as Biz, lang), { link_preview_options: { is_disabled: true }, reply_markup: keyboard(lang) });
      return;
    }
    await ctx.reply(BOT_TEXT[lang].hello, { reply_markup: keyboard(lang) });
  });
  bot.command("brief", async (ctx) => {
    const lang = langOf(ctx.from?.language_code);
    await ctx.reply(BOT_TEXT[lang].pick, { reply_markup: keyboard(lang) });
  });
  bot.command("help", async (ctx) => {
    const lang = langOf(ctx.from?.language_code);
    await ctx.reply(BOT_TEXT[lang].help);
  });
  bot.callbackQuery(/^b:(shop|cafe|salon|auto):(ru|kz)$/, async (ctx) => {
    const [, biz, lang] = ctx.match as RegExpMatchArray;
    await ctx.answerCallbackQuery();
    await ctx.reply(botBrief(biz as Biz, lang as BotLang), { link_preview_options: { is_disabled: true }, reply_markup: keyboard(lang as BotLang) });
  });
  bot.callbackQuery(/^l:(ru|kz)$/, async (ctx) => {
    const lang = (ctx.match as RegExpMatchArray)[1] as BotLang;
    await ctx.answerCallbackQuery();
    await ctx.reply(BOT_TEXT[lang].pick, { reply_markup: keyboard(lang) });
  });
  bot.on("message", async (ctx) => {
    const lang = langOf(ctx.from?.language_code);
    await ctx.reply(BOT_TEXT[lang].pick, { reply_markup: keyboard(lang) });
  });
  bot.catch((err) => console.warn("[bot] error:", String(err.error).slice(0, 200)));
  handler = webhookCallback(bot, "std/http", { timeoutMilliseconds: 15_000 });
  return handler;
}

export async function POST(req: Request) {
  if (!token) return new Response("bot disabled", { status: 200 });
  const got = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const want = webhookSecret(token);
  if (got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return new Response("forbidden", { status: 401 });
  try {
    return await getHandler()!(req);
  } catch (e) {
    console.warn("[bot] handler failed:", String(e).slice(0, 200));
    return new Response("ok", { status: 200 });
  }
}

export function GET() {
  return Response.json({ ok: true, bot: !!token });
}
