/** Скелет дашборда, пока грузится код вкладок (без хуков — можно рендерить где угодно). */
export function BootScreen() {
  const bar = "animate-pulse rounded-2xl bg-muted";
  return (
    <div className="flex-1" aria-busy="true" aria-label="KaltaAI">
      <div className="sticky top-0 h-14 border-b bg-background/90" />
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4">
        <div className={`${bar} h-12`} />
        <div className={`${bar} h-48`} />
        <div className={`${bar} h-36`} />
        <div className="grid grid-cols-2 gap-3">
          <div className={`${bar} h-24`} />
          <div className={`${bar} h-24`} />
        </div>
        <div className={`${bar} h-64`} />
      </div>
    </div>
  );
}
