import type { AgeBand } from "../../schemas/common";
import type { RatingKey } from "../../schemas/title";

export const MIN_AGE = 3;
export const MAX_AGE = 17;

export function parseAge(input: string | null | undefined): number | null {
  if (input == null) return null;
  const n = Number.parseInt(String(input), 10);
  if (!Number.isInteger(n) || n < MIN_AGE || n > MAX_AGE) return null;
  return n;
}

export function ageBandOf(age: number): AgeBand {
  if (age < 7) return "under7";
  if (age <= 12) return "7to12";
  return "13plus";
}

/**
 * يستخرج «أقل عمر» من قيمة التصنيف كما هي مكتوبة عند جهتها فقط.
 * لا نحوّل تصنيف جهة إلى جهة ثانية، ولا نخمّن: أي قيمة غير مفهومة ⇒ null.
 */
export function minAgeFromRating(system: RatingKey, value: string | null): number | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (system === "esrb") {
    const map: Record<string, number> = {
      E: 0,
      EVERYONE: 0,
      "E10+": 10,
      "EVERYONE 10+": 10,
      T: 13,
      TEEN: 13,
      M: 17,
      "MATURE 17+": 17,
      MATURE: 17,
      AO: 18,
      "ADULTS ONLY 18+": 18,
    };
    return map[v] ?? null;
  }
  if (system === "googlePlay") {
    const map: Record<string, number> = {
      EVERYONE: 0,
      "EVERYONE 10+": 10,
      TEEN: 13,
      "MATURE 17+": 17,
      "ADULTS ONLY 18+": 18,
    };
    if (v in map) return map[v] ?? null;
  }
  const m = v.match(/(\d{1,2})\s*\+?/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 0 && n <= 21 ? n : null;
}

export type AgeComparison = "above" | "within" | "unavailable";

export function compareAge(system: RatingKey, value: string | null, age: number): AgeComparison {
  const min = minAgeFromRating(system, value);
  if (min === null) return "unavailable";
  return min > age ? "above" : "within";
}
