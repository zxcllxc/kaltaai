import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/app/providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap", preload: false });

const title = "KaltaAI — ИИ-финдиректор для бизнеса Тараза";
const description = "Сколько денег свободно сегодня, когда их не хватит и что сделать — по выгрузке Kaspi, Excel или CSV. Прогноз на 14 дней, налоговый конверт 2026, утечки в ₸.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kaltaai.vercel.app"),
  title,
  description,
  applicationName: "KaltaAI",
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    url: "/",
    siteName: "KaltaAI",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "KaltaAI — свободные деньги сегодня, прогноз на 14 дней и налоговый конверт" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#059669" };

// До первой отрисовки: если в браузере уже есть данные (или ссылка ?demo=), прячем лендинг,
// чтобы не мигал перед дашбордом. Через 5 с CSS всё равно покажет лендинг (на случай сбоя JS).
const BOOT = `try{var v=localStorage.getItem("findir:v1");if((v&&(v.indexOf('"ds":{')>-1||v.indexOf('"lang":"kz"')>-1))||/[?&]demo=(shop|cafe|salon|auto)/.test(location.search))document.documentElement.classList.add("kalta-boot")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
