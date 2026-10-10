import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/print.css";
import { ar } from "@/lib/i18n/ar";
import { plexArabic, plexLatin } from "./fonts";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConsentNotice } from "@/components/ConsentNotice";
import { SwRegister } from "@/components/SwRegister";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${ar.app.name} — اعرف، اضبط، تحاور، اتفق`, template: `%s · ${ar.app.name}` },
  description: ar.app.description,
  applicationName: ar.app.name,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: ar.app.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    title: ar.app.name,
    description: ar.app.description,
    locale: "ar_SA",
    type: "website",
  },
  robots: { index: true, follow: true },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d5c52" },
    { media: "(prefers-color-scheme: dark)", color: "#111715" },
  ],
};

// يطبّق المظهر قبل الرسم لتفادي الوميض. (محلي، بدون أي طلب شبكة)
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem("dalil.theme")||"null");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${plexLatin.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-brand focus:p-3 focus:text-brand-ink"
        >
          {ar.app.skipToContent}
        </a>
        <SiteHeader />
        <main
          id="main"
          className="mx-auto w-full max-w-3xl px-4 py-6 has-[[data-wide]]:lg:max-w-5xl"
        >
          {children}
        </main>
        <SiteFooter />
        <ConsentNotice />
        <SwRegister />
      </body>
    </html>
  );
}
