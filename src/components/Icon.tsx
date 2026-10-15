/** أيقونات خطية بسيطة (SVG داخلي، لون النص الحالي). بديل للـemoji اللي يختلف شكله من جهاز لجهاز. */
const PATHS = {
  know: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
      <path d="M11 8.5v3l2 1.5" />
    </>
  ),
  setup: (
    <>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  talk: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
      <path d="M8.5 9h7M8.5 12h4.5" />
    </>
  ),
  agree: (
    <>
      <path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z" />
      <path d="M9 8h6M9 11h6" />
      <path d="m9 15.5 2 2 4-4" />
    </>
  ),
  lens: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  prayer: (
    <>
      <path d="M14.5 3.5a8.5 8.5 0 1 0 6 13.5 7 7 0 0 1-6-13.5z" />
      <path d="m17.5 7 .6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V3.5h10V8" />
      <path d="M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 5 8h14a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 19 17h-2" />
      <path d="M7 13.5h10v7H7z" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  // تسليم الجوال: جوال ← سهم ← شخص (يُقلب بالاتجاه حسب الخطوة).
  handoff: (
    <>
      <rect x="2.5" y="5" width="7" height="14" rx="1.5" />
      <path d="M5 16.5h2" />
      <path d="M11 12h4m0 0-1.5-1.5M15 12l-1.5 1.5" />
      <circle cx="19" cy="8.5" r="2" />
      <path d="M16 19v-2.5a3 3 0 0 1 6 0V19" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/** شعار الدليل: نفس رسمة أيقونة التطبيق (public/icons/icon.svg). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="112" fill="var(--color-brand)" />
      <circle cx="256" cy="256" r="150" fill="none" stroke="#fbecd8" strokeWidth="28" />
      <path
        d="M196 300c0-50 40-90 90-90"
        fill="none"
        stroke="#fbecd8"
        strokeWidth="28"
        strokeLinecap="round"
      />
      <circle cx="286" cy="300" r="26" fill="#f2b56b" />
    </svg>
  );
}
