"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { House, TrendingUp, TriangleAlert, ListChecks, MessageCircle, Ellipsis } from "lucide-react";
import { useApp } from "@/lib/store";
import { TopBar } from "./topbar";
import { Home } from "./home";
import { Forecast } from "./forecast";
import { Leaks } from "./leaks";
import { Todo } from "./todo";
import { Chat } from "./chat";
import { More } from "./more";
import { Tour } from "./tour";
import { cn } from "@/lib/utils";

export type Tab = "home" | "forecast" | "leaks" | "todo" | "chat" | "more";
const TabCtx = createContext<(t: Tab) => void>(() => {});
export const useGo = () => useContext(TabCtx);

export function Shell() {
  const { t } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [tour, setTour] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("tour")) setTour(true);
    const h = window.location.hash.slice(1) as Tab;
    if (["home", "forecast", "leaks", "todo", "chat", "more"].includes(h)) setTab(h);
  }, []);
  const go = (x: Tab) => {
    setTab(x);
    history.replaceState(null, "", window.location.search + "#" + x);
    window.scrollTo({ top: 0 });
  };
  const nav: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "home", label: t.home, icon: House },
    { id: "forecast", label: "14 дн", icon: TrendingUp },
    { id: "leaks", label: t.leaks, icon: TriangleAlert },
    { id: "todo", label: t.plan, icon: ListChecks },
    { id: "chat", label: t.chat, icon: MessageCircle },
    { id: "more", label: t.more, icon: Ellipsis },
  ];
  return (
    <TabCtx.Provider value={go}>
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className={`mx-auto w-full max-w-3xl px-4 pt-4 ${tour ? "pb-72" : "pb-28"}`}>
          {tab === "home" && <Home />}
          {tab === "forecast" && <Forecast />}
          {tab === "leaks" && <Leaks />}
          {tab === "todo" && <Todo />}
          {tab === "chat" && <Chat />}
          {tab === "more" && <More />}
        </main>
        {tour && (
          <Tour
            go={go}
            onClose={() => {
              setTour(false);
              history.replaceState(null, "", window.location.pathname + window.location.hash);
            }}
          />
        )}
        <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-3xl grid-cols-6">
            {nav.map((n) => (
              <button
                key={n.id}
                data-tour={`tab-${n.id}`}
                onClick={() => go(n.id)}
                className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px]", tab === n.id ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground")}
              >
                <n.icon className="size-5" />
                <span className="truncate max-w-full px-1">{n.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </TabCtx.Provider>
  );
}
