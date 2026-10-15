/** تاريخ ميلادي + هجري (أم القرى) بأرقام واضحة. */
export function formatDateAr(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const g = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  let h = "";
  try {
    h = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    // بعض البيئات ما تدعم التقويم الهجري
  }
  return h ? `${g} (${h})` : g;
}

export function isDue(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() <= now.getTime();
}
