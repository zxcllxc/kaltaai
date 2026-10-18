"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
import { ErrorBoundary } from "./error-boundary";
import { cn } from "@/lib/utils";

export type Tab = "home" | "forecast" | "leaks" | "todo" | "chat" | "more";
const TABS: Tab[] = ["home", "forecast", "leaks", "todo", "chat", "more"];
const TabCtx = createContext<(t: Tab) => void>(() => {});
export const useGo = () => useContext(TabCtx);

const fromHash = (): Tab => {
  const h = window.location.hash.slice(1) as Tab;
  return TABS.includes(h) ? h : "home";
};

export function Shell() {
  const { t, clear, ds } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [tour, setTour] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("tour")) setTour(true); // eslint-disable-line react-hooks/set-state-in-effect
    setTab(fromHash());
    // «назад» на телефоне возвращает на предыдущую вкладку, а не уводит с сайта
    const onPop = () => setTab(fromHash());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const cur = useRef<Tab>("home");
  useEffect(() => {
    cur.current = tab;
  }, [tab]);
  const go = useCallback((x: Tab) => {
    if (cur.current !== x) {
      try {
        window.history.pushState({ tab: x }, "", window.location.pathname + window.location.search + "#" + x);
      } catch {}
    }
    cur.current = x;
    setTab(x);
    window.scrollTo({ top: 0 });
  }, []);

  const nav: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "home", label: t.navHome, icon: House },
    { id: "forecast", label: t.navForecast, icon: TrendingUp },
    { id: "leaks", label: t.navLeaks, icon: TriangleAlert },
    { id: "todo", label: t.navPlan, icon: ListChecks },
    { id: "chat", label: t.navChat, icon: MessageCircle },
    { id: "more", label: t.navMore, icon: Ellipsis },
  ];
  const labels = { title: t.errScreen, reload: t.errReload, restart: t.errRestart };
  return (
    <TabCtx.Provider value={go}>
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className={`mx-auto w-full max-w-3xl px-4 pt-4 ${tour ? "pb-72" : "pb-28"}`}>
          <ErrorBoundary resetKey={`${tab}|${ds?.source}|${ds?.biz}`} labels={labels} onRestart={clear}>
            {tab === "home" && <Home />}
            {tab === "forecast" && <Forecast />}
            {tab === "leaks" && <Leaks />}
            {tab === "todo" && <Todo />}
            {tab === "chat" && <Chat />}
            {tab === "more" && <More />}
          </ErrorBoundary>
        </main>
        {tour && (
          <Tour
            go={go}
            onClose={() => {
              setTour(false);
              try {
                window.history.replaceState(null, "", window.location.pathname + window.location.hash);
              } catch {}
            }}
          />
        )}
        <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] print:hidden" aria-label="KaltaAI">
          <div className="mx-auto grid max-w-3xl grid-cols-6">
            {nav.map((n) => (
              <button
                key={n.id}
                data-tour={`tab-${n.id}`}
                onClick={() => go(n.id)}
                aria-current={tab === n.id ? "page" : undefined}
                className={cn("flex min-w-0 flex-col items-center gap-0.5 py-2 text-[11px] leading-tight", tab === n.id ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-muted-foreground")}
              >
                <n.icon className="size-5" aria-hidden />
                <span className="max-w-full px-0.5 text-center">{n.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </TabCtx.Provider>
  );
}
