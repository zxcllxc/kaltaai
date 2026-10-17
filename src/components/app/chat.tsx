"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot } from "lucide-react";
import { useApp } from "@/lib/store";
import { briefing } from "@/lib/texts";
import { answer, SUGGESTED } from "@/lib/ask";
import { factsForLLM } from "@/lib/texts";
import { useAiActions } from "./todo";

interface Msg {
  from: "bot" | "me";
  text: string;
  time: string;
}

const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function Chat() {
  const { a, ds, lang } = useApp();
  const ai = useAiActions();
  const [shown, setShown] = useState(0);
  const [extra, setExtra] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const brief = a && ds ? briefing(a, ds, lang, ai ?? undefined) : [];

  useEffect(() => {
    setShown(0);
  }, [lang]);
  useEffect(() => {
    if (shown >= brief.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 300 : 450);
    return () => clearTimeout(id);
  }, [shown, brief.length]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [shown, extra.length, typing]);

  if (!a || !ds) return null;

  async function ask(text: string) {
    if (!text.trim() || !a || !ds) return;
    setQ("");
    setExtra((m) => [...m, { from: "me", text, time: now() }]);
    setTyping(true);
    const local = answer(text, a, ds);
    let reply = local;
    try {
      const r = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ask", question: text, facts: { ...factsForLLM(a, ds), computedAnswer: local } }),
      }).then((r) => r.json());
      if (r.ai && r.answer) reply = r.answer;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
    setTyping(false);
    setExtra((m) => [...m, { from: "bot", text: reply, time: now() }]);
  }

  const t0 = "08:00";
  return (
    <div className="-mx-4 -mt-4 flex flex-col min-h-[calc(100dvh-8.5rem)] bg-[#c7d8b8] dark:bg-[#0e1621] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.25),transparent_40%)]">
      <div className="flex items-center gap-3 bg-[#517da2] dark:bg-[#17212b] px-4 py-2 text-white">
        <div className="size-10 rounded-full bg-emerald-500 grid place-items-center">
          <Bot className="size-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">KaltaAI</div>
          <div className="text-xs opacity-80">{typing || shown < brief.length ? "печатает…" : "бот"}</div>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 px-3 py-3">
        <div className="mx-auto w-fit rounded-full bg-black/20 px-3 py-0.5 text-xs text-white">Сегодня</div>
        {brief.slice(0, shown).map((m, i) => (
          <Bubble key={i} m={{ from: "bot", text: m, time: t0 }} />
        ))}
        {shown >= brief.length && extra.map((m, i) => <Bubble key={"e" + i} m={m} />)}
        {typing && <Bubble m={{ from: "bot", text: "…", time: "" }} />}
        <div ref={end} />
      </div>
      {shown >= brief.length && (
        <div className="sticky bottom-16 space-y-2 px-3 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => ask(s)} className="shrink-0 rounded-full bg-white/90 dark:bg-[#182533] px-3 py-1.5 text-xs text-[#2b5278] dark:text-[#6ab2f2] shadow">
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(q);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Спросите KaltaAI…"
              className="flex-1 rounded-full bg-white dark:bg-[#17212b] px-4 py-2.5 text-sm text-black dark:text-white outline-none"
            />
            <button className="size-10 rounded-full bg-[#5288c1] text-white grid place-items-center" aria-label="Отправить">
              <Send className="size-4" />
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
        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[15px] leading-snug shadow-sm whitespace-pre-line animate-in fade-in slide-in-from-bottom-1 ${
          me ? "rounded-br-sm bg-[#effdde] dark:bg-[#2b5278] text-black dark:text-white" : "rounded-bl-sm bg-white dark:bg-[#182533] text-black dark:text-white"
        }`}
      >
        {m.text}
        {m.time && <span className="ml-2 align-bottom text-[10px] text-black/40 dark:text-white/40">{m.time}</span>}
      </div>
    </div>
  );
}
