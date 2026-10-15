import localFont from "next/font/local";

// IBM Plex Sans Arabic (OFL) — ملفات محلية، بدون أي CDN.
export const plexArabic = localFont({
  src: [
    { path: "../fonts/plex-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plex-arabic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-ar",
  display: "optional",
  preload: true,
});

export const plexLatin = localFont({
  src: [
    { path: "../fonts/plex-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plex-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-latin",
  display: "optional",
  preload: false,
});
