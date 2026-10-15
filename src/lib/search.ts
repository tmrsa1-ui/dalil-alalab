import Fuse from "fuse.js";
import type { TitleIndexEntry } from "../../schemas/title";
import { compactKey, normalizeArabic } from "./normalize-ar";

type Row = { entry: TitleIndexEntry; keys: string[]; compact: string[] };

export type SearchResult = { entry: TitleIndexEntry; exact: boolean };

export function createSearcher(index: TitleIndexEntry[]) {
  const rows: Row[] = index.map((entry) => {
    const names = [entry.nameAr, entry.nameEn, ...entry.aliases];
    return {
      entry,
      keys: names.map(normalizeArabic),
      compact: names.map(compactKey),
    };
  });

  const fuse = new Fuse(rows, {
    keys: ["keys", "compact"],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return function search(query: string, limit = 6): SearchResult[] {
    const q = normalizeArabic(query);
    const qc = compactKey(query);
    if (q.length === 0) return [];

    // 1) تطابق تام مع الاسم أو المرادف (بعد التطبيع وحذف المسافات).
    const exact = rows.filter((r) => r.compact.includes(qc));
    // 2) يبدأ بـ (للإكمال التلقائي أثناء الكتابة).
    const prefix = rows.filter(
      (r) => !exact.includes(r) && r.compact.some((k) => k.startsWith(qc)),
    );
    // 3) بحث ضبابي.
    const fuzzy = fuse
      .search(q)
      .map((x) => x.item)
      .filter((r) => !exact.includes(r) && !prefix.includes(r));

    return [
      ...exact.map((r) => ({ entry: r.entry, exact: true })),
      ...prefix.map((r) => ({ entry: r.entry, exact: false })),
      ...fuzzy.map((r) => ({ entry: r.entry, exact: false })),
    ].slice(0, limit);
  };
}

/** أفضل تطابق واحد أو null. */
export function resolveTitle(index: TitleIndexEntry[], query: string): TitleIndexEntry | null {
  const [first] = createSearcher(index)(query, 1);
  return first?.entry ?? null;
}
