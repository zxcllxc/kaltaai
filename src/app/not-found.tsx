import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-24">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto size-14 rounded-2xl bg-emerald-700 text-white grid place-items-center text-3xl font-bold" aria-hidden>
          ₸
        </div>
        <h1 className="text-2xl font-bold">Страница не найдена · Бет табылмады</h1>
        <p className="text-muted-foreground">Такой страницы нет. Вернитесь на главную KaltaAI — там демо в один клик.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white">
            На главную · Басты бетке
          </Link>
          <Link href="/pitch" className="rounded-lg border px-4 py-2">
            Питч для жюри
          </Link>
        </div>
      </div>
    </main>
  );
}
