"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import type { BalanceChart as Chart } from "./chart";

// Библиотека графиков (~140 КБ) грузится и рисуется, только когда график доходит до экрана;
// место зарезервировано — без прыжков вёрстки.
const Lazy = dynamic(() => import("./chart").then((m) => m.BalanceChart), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-muted" aria-hidden />,
});

export function BalanceChart(props: ComponentProps<typeof Chart>) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (setShow(true), io.disconnect()), { rootMargin: "150px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ height: props.height ?? 240 }} className="w-full">
      {show ? <Lazy {...props} /> : <div className="h-full w-full rounded-lg bg-muted/60" aria-hidden />}
    </div>
  );
}
