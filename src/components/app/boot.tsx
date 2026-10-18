/** Экран загрузки дашборда (без хуков — можно рендерить где угодно). */
export function BootScreen() {
  return (
    <div className="flex-1 grid place-items-center py-24" aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-12 rounded-xl bg-emerald-600 text-white grid place-items-center text-2xl font-bold animate-pulse">₸</div>
        <div className="text-sm">KaltaAI…</div>
      </div>
    </div>
  );
}
