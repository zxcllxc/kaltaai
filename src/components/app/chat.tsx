"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Bot } from "lucide-react";
import { useApp } from "@/lib/store";
import { briefing, factsForLLM } from "@/lib/texts";
import { answer, MAX_QUESTION } from "@/lib/ask";
import { DEMO_AI } from "@/lib/demo-ai";
import { FLAGS } from "@/lib/flags";
import { useAiActions } from "./todo";
import { onDate } from "@/lib/dates";
import { AiBadge, callAI, useAI } from "./ai";

interface Msg {
  from: "bot" | "me";
  text: string;
  time: string;
  ai?: boolean;
}

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function Chat() {
  const { a, ds, lang, t } = useApp();
  const { ai } = useAiActions();
  const facts = useMemo(() => (a && ds ? factsForLLM(a, ds, lang) : null), [a, ds, lang]);
  const preset = ds?.isDemo && FLAGS.aiCache && lang === "ru" ? (DEMO_AI[ds.biz]?.brief ?? null) : null;
  const presetObj = useMemo(() => (preset ? { messages: preset } : null), [preset]);
  const aiBrief = useAI<{ messages: string[] }>("brief", facts, { enabled: !!facts && lang === "ru", preset: presetObj });
  const when = a?.story.date ? onDate(a.story.date, lang) : "";
  const extraBrief = (aiBrief.data?.messages ?? []).filter((m) => typeof m === "string" && m.trim()).slice(0, 2).map((m) => "🤖 " + m.trim().split("{date}").join(when));

  const [shown, setShown] = useState(0);
  const [extra, setExtra] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState(false);
  const [warn, setWarn] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const brief = a && ds ? [...briefing(a, ds, lang, ai), ...extraBrief] : [];

  useEffect(() => {
    setShown(0); // eslint-disable-line react-hooks/set-state-in-effect
    setExtra([]);
  }, [lang, ds?.source, ds?.biz]);
  useEffect(() => {
    if (shown >= brief.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 250 : 380);
    return () => clearTimeout(id);
  }, [shown, brief.length]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [shown, extra.length, typing]);

  if (!a || !ds) return null;

  async function ask(text: string) {
    const clean = text.trim();
    if (!clean || !a || !ds || typing) return;
    if (clean.length > MAX_QUESTION) {
      setWarn(t.tooLong);
      return;
    }
    setWarn("");
    setQ("");
    setExtra((m) => [...m, { from: "me", text: clean, time: now() }]);
    setTyping(true);
    const local = answer(clean, a, ds, lang);
    const r = await callAI<{ answer: string }>("ask", { ...facts, computedAnswer: local }, clean, lang);
    const reply = r?.answer?.trim() ? r.answer.trim() : local;
    setTyping(false);
    setExtra((m) => [...m, { from: "bot", text: reply, time: now(), ai: !!r?.answer }]);
  }

  const t0 = "08:00";
  const done = shown >= brief.length;
  return (
    <div className="-mx-4 -mt-4 flex flex-col min-h-[calc(100dvh-8.5rem)] bg-[#c7d8b8] dark:bg-[#0e1621]">
      <div className="flex items-center gap-3 bg-[#517da2] dark:bg-[#17212b] px-4 py-2 text-white">
        <div className="size-10 rounded-full bg-emerald-600 grid place-items-center" aria-hidden>
          <Bot className="size-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">KaltaAI</div>
          <div className="text-xs opacity-90">{typing || !done ? t.typing : t.bot}</div>
        </div>
        <div className="ml-auto">
          <AiBadge ai={extraBrief.length > 0} loading={aiBrief.loading} />
        </div>
      </div>
      <div className="flex-1 space-y-1.5 px-3 py-3" aria-live="polite">
        <div className="mx-auto w-fit rounded-full bg-black/25 px-3 py-0.5 text-xs text-white">{t.today}</div>
        {brief.slice(0, shown).map((m, i) => (
          <Bubble key={i} m={{ from: "bot", text: m, time: t0 }} />
        ))}
        {done && extra.map((m, i) => <Bubble key={"e" + i} m={m} />)}
        {typing && <Bubble m={{ from: "bot", text: "…", time: "" }} />}
        <div ref={end} />
      </div>
      {done && (
        <div className="sticky bottom-16 space-y-2 px-3 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="list">
            {t.suggestions.map((s) => (
              <button key={s} role="listitem" onClick={() => ask(s)} disabled={typing} className="shrink-0 rounded-full bg-white dark:bg-[#182533] px-3 py-1.5 text-xs text-[#1f4a73] dark:text-[#8ec5ff] shadow disabled:opacity-60">
                {s}
              </button>
            ))}
          </div>
          {warn && <div className="rounded-md bg-white/90 px-2 py-1 text-xs text-red-700">{warn}</div>}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(q);
            }}
          >
            <input
              value={q}
              maxLength={MAX_QUESTION + 50}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="flex-1 min-w-0 rounded-full bg-white dark:bg-[#17212b] px-4 py-2.5 text-sm text-black dark:text-white outline-none"
            />
            <button className="size-10 shrink-0 rounded-full bg-[#2f6ea5] text-white grid place-items-center disabled:opacity-60" aria-label={t.send} disabled={typing}>
              <Send className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const me = m.from === "me";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[15px] leading-snug shadow-sm whitespace-pre-line break-words ${
          me ? "rounded-br-sm bg-[#effdde] dark:bg-[#2b5278] text-black dark:text-white" : "rounded-bl-sm bg-white dark:bg-[#182533] text-black dark:text-white"
        }`}
      >
        {m.text}
        {m.ai !== undefined && (
          <span className="ml-2 align-middle">
            <AiBadge ai={m.ai} />
          </span>
        )}
        {m.time && <span className="ml-2 align-bottom text-[10px] text-black/55 dark:text-white/55">{m.time}</span>}
      </div>
    </div>
  );
}
