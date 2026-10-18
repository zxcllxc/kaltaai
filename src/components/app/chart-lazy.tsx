"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { BalanceChart as Chart } from "./chart";

// Библиотека графиков (~140 КБ) грузится после первого экрана; место под график зарезервировано — без прыжков вёрстки.
const Lazy = dynamic(() => import("./chart").then((m) => m.BalanceChart), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-muted" aria-hidden />,
});

export function BalanceChart(props: ComponentProps<typeof Chart>) {
  return (
    <div style={{ height: props.height ?? 240 }} className="w-full">
      <Lazy {...props} />
    </div>
  );
}
