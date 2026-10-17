"use client";

import { useApp } from "@/lib/store";
import { Start } from "@/components/app/start";
import { Shell } from "@/components/app/shell";

export default function Page() {
  const { ds, ready } = useApp();
  if (!ready) return <div className="flex-1 grid place-items-center text-muted-foreground">Загрузка…</div>;
  return ds ? <Shell /> : <Start />;
}
