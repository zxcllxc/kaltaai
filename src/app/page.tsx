"use client";

import dynamic from "next/dynamic";
import { useApp } from "@/lib/store";
import { Start } from "@/components/app/start";
import { BootScreen } from "@/components/app/boot";

// Дашборд (графики, вкладки) грузится отдельно — первый экран лёгкий и рендерится на сервере.
const Shell = dynamic(() => import("@/components/app/shell").then((m) => m.Shell), { ssr: false, loading: () => <BootScreen /> });

export default function Page() {
  const { ds } = useApp();
  return ds ? <Shell /> : <Start />;
}
