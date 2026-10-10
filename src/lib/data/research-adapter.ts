/**
 * يحوّل ملف البحث (research/seed_titles_verified.json) إلى تعديلات على بطاقات العناوين.
 *
 * قواعد القبول (أي شي ما يحققها يُرفض ويُسجَّل سببه، ويبقى «غير متوفر/ما لقيت»):
 * - التصنيف: رابطه لازم يكون من نطاق الجهة المصنفة نفسها، وله تاريخ تحقق
 *   (من العنصر نفسه أو `_meta.verified_on`). القيمة تُنقل كما هي بدون تحويل.
 * - نقطة الانتباه: رابطها رسمي (allowlist)، وفيها اقتباس حرفي واحد على الأقل بين «»
 *   (مثل «Users Interact» من ESRB). بدون اقتباس حرفي ⇐ مرفوضة.
 * - «عدسة الأسرة»: نفس القاعدة؛ إشارة عامة مثل «حسب وصف ESRB» بدون اقتباس ⇐ مرفوضة.
 * - رابط الرقابة الأبوية: رسمي، وما يكون مكتوب عليه إنه يحتاج تأكيد يدوي.
 * - كل المقبول يُعلَّم confidence: "auto" (بحاجة مراجعة بشرية) لأن الملف ما راجعه إنسان.
 */
import { z } from "zod";
import { POINT_KEYS, type PointKey } from "../../../schemas/common";
import type { RatingKey, Title } from "../../../schemas/title";
import { hostOf, isAllowedUrl, isRatingAuthorityUrl } from "../agent/allowlist";
import { findForbiddenWord } from "../forbidden-words";

const cited = z
  .object({ text: z.string(), url: z.string(), verifiedAt: z.string().optional() })
  .nullable();

export const researchFileSchema = z.object({
  _meta: z
    .object({
      status: z.string().optional(),
      verified_on: z.string().optional(),
      method: z.string().optional(),
    })
    .passthrough()
    .optional(),
  titles: z.array(
    z
      .object({
        id: z.string(),
        name: z.string().optional(),
        aliases: z.array(z.string()).optional(),
        ratings: z
          .array(
            z.object({
              system: z.string(),
              value: z.string(),
              url: z.string(),
              verifiedAt: z.string().optional(),
            }),
          )
          .optional(),
        watch: z
          .object({ chat: cited, purchases: cited, content: cited, ads: cited, session: cited })
          .partial()
          .optional(),
        lens: cited.optional(),
        controls: z
          .object({ url: z.string(), label: z.string(), verifiedAt: z.string().optional() })
          .nullable()
          .optional(),
      })
      .passthrough(),
  ),
  device_controls: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
});
export type ResearchFile = z.infer<typeof researchFileSchema>;

export type Decision = { slug: string; field: string; accepted: boolean; reason: string };

const WATCH_TO_POINT: Record<string, PointKey> = {
  chat: "strangerChat",
  purchases: "purchases",
  content: "content",
  ads: "ads",
  session: "sessionPause",
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function ratingKeyOf(system: string): RatingKey | null {
  const s = system.trim().toLowerCase();
  if (s.startsWith("app store")) return "appStore";
  if (s.startsWith("google play")) return "googlePlay";
  if (s.startsWith("esrb")) return "esrb";
  if (s.startsWith("pegi")) return "pegi";
  if (s.startsWith("gcam") || s.startsWith("gmedia") || s.includes("الهيئة العامة لتنظيم الإعلام"))
    return "gcam";
  return null;
}

/** النسخة بين القوسين (لـESRB/PEGI فقط؛ «(السعودية)» في App Store منطقة المتجر مو نسخة). */
function editionOf(system: string, key: RatingKey): string | undefined {
  if (key !== "esrb" && key !== "pegi") return undefined;
  return system.match(/\(([^)]+)\)/)?.[1]?.trim() || undefined;
}

/** الاقتباسات الحرفية بين «» (نصوص لاتينية منقولة من الصفحة الرسمية). */
export function verbatimQuotes(text: string): string[] {
  return [...text.matchAll(/«([^»]+)»/g)]
    .map((m) => m[1]!.trim())
    .filter((q) => /[A-Za-z]/.test(q));
}

function sourceTitle(url: string, titleName: string): string {
  const host = hostOf(url) ?? url;
  if (host.endsWith("esrb.org")) return `ESRB: ${titleName}`;
  if (host.endsWith("pegi.info")) return `PEGI: ${titleName}`;
  if (host.endsWith("apple.com")) return `App Store: ${titleName}`;
  if (host.endsWith("play.google.com")) return `Google Play: ${titleName}`;
  return `${host}: ${titleName}`;
}

/** يطبق ملف البحث على بطاقة واحدة ويرجع البطاقة الجديدة + قرارات القبول/الرفض. */
export function applyResearch(
  current: Title,
  entry: ResearchFile["titles"][number],
  meta: ResearchFile["_meta"],
): { title: Title; decisions: Decision[] } {
  const slug = current.slug;
  const decisions: Decision[] = [];
  const decide = (field: string, accepted: boolean, reason: string) =>
    decisions.push({ slug, field, accepted, reason });
  const next: Title = structuredClone(current);
  next.isDemo = false;
  const fallbackDate = meta?.verified_on && ISO.test(meta.verified_on) ? meta.verified_on : null;
  const dateOf = (d?: string) => (d && ISO.test(d) ? d : fallbackDate);
  const name = entry.name ?? current.nameEn;

  for (const r of entry.ratings ?? []) {
    const key = ratingKeyOf(r.system);
    const field = `ratings.${key ?? r.system}`;
    const date = dateOf(r.verifiedAt);
    if (!key) {
      decide(field, false, `جهة تصنيف غير معروفة: ${r.system}`);
      continue;
    }
    if (!isRatingAuthorityUrl(r.url, key)) {
      decide(field, false, `الرابط مو من نطاق الجهة المصنفة: ${r.url}`);
      continue;
    }
    if (!date) {
      decide(field, false, "بدون تاريخ تحقق");
      continue;
    }
    if (next.ratings[key].value !== null) {
      decide(field, false, "فيه قيمة سابقة لنفس الجهة؛ ما نكتب فوقها");
      continue;
    }
    next.ratings[key] = {
      value: r.value.trim(),
      sourceUrl: r.url,
      verifiedAt: date,
      confidence: "auto",
      ...(editionOf(r.system, key) ? { edition: editionOf(r.system, key) } : {}),
    };
    decide(field, true, `${r.value} ← ${r.url}`);
  }

  // واصفات ESRB من نص «نوع المحتوى» لو الاقتباس من نفس صفحة التصنيف.
  const contentWatch = entry.watch?.content;
  if (contentWatch && next.ratings.esrb.sourceUrl === contentWatch.url && next.ratings.esrb.value) {
    const descriptors = verbatimQuotes(contentWatch.text)
      .flatMap((q) => q.split(","))
      .map((d) => d.trim())
      .filter(Boolean);
    if (descriptors.length) next.ratings.esrb.descriptors = descriptors;
  }

  for (const [wKey, pKey] of Object.entries(WATCH_TO_POINT)) {
    const w = entry.watch?.[wKey as keyof NonNullable<typeof entry.watch>];
    const field = `attentionPoints.${pKey}`;
    if (!w) continue;
    const date = dateOf(w.verifiedAt);
    const quotes = verbatimQuotes(w.text);
    const summary = w.text.trim();
    if (!isAllowedUrl(w.url)) decide(field, false, `رابط غير رسمي: ${w.url}`);
    else if (!date) decide(field, false, "بدون تاريخ تحقق");
    else if (!quotes.length) decide(field, false, "بدون اقتباس حرفي من المصدر");
    else if (summary.length > 220) decide(field, false, "النص أطول من سطرين");
    else if (findForbiddenWord(summary)) decide(field, false, "كلمة ممنوعة في النص");
    else {
      Object.assign(next.attentionPoints[pKey], {
        status: "present",
        summaryAr: summary,
        sources: [
          {
            url: w.url,
            title: sourceTitle(w.url, name),
            quote: quotes.join(", "),
            verifiedAt: date,
          },
        ],
        confidence: "auto",
      });
      decide(field, true, `«${quotes.join(", ")}» ← ${w.url}`);
    }
  }

  if (entry.lens) {
    const quotes = verbatimQuotes(entry.lens.text);
    if (!quotes.length)
      decide("familyLens", false, `إشارة عامة بدون اقتباس حرفي: «${entry.lens.text}»`);
    else decide("familyLens", false, "ما نربط بند العدسة آليًا؛ يحتاج مراجعة بشرية لتحديد البند");
  }

  if (entry.controls) {
    const c = entry.controls;
    const date = dateOf(c.verifiedAt);
    if (!isAllowedUrl(c.url)) decide("controls.officialGuide", false, `رابط غير رسمي: ${c.url}`);
    else if (/يحتاج تأكيد|يحجب الفحص/.test(c.label)) {
      decide("controls.officialGuide", false, `المصدر نفسه يقول إنه ما تحقق: «${c.label}»`);
    } else if (!date) decide("controls.officialGuide", false, "بدون تاريخ تحقق");
    else if (findForbiddenWord(c.label))
      decide("controls.officialGuide", false, "كلمة ممنوعة في الوصف");
    else {
      next.controls.officialGuide = {
        url: c.url,
        labelAr: c.label,
        verifiedAt: date,
        confidence: "auto",
      };
      decide("controls.officialGuide", true, c.url);
    }
  }

  if (entry.aliases?.length) {
    next.aliases = [
      ...new Set([...next.aliases, ...entry.aliases.map((a) => a.trim()).filter(Boolean)]),
    ].filter((a) => a !== next.nameAr);
  }

  const anyAccepted =
    Object.values(next.ratings).some((r) => r.value !== null) ||
    POINT_KEYS.some((k) => next.attentionPoints[k].status !== "unknown") ||
    !!next.controls.officialGuide;
  if (anyAccepted && next.reviewStatus === "not_found") next.reviewStatus = "auto_sourced";
  return { title: next, decisions };
}
