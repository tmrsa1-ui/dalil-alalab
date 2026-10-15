/**
 * يفصل خطوة مثل «الإعدادات ← Screen Time ← Content Restrictions: اختر ...»
 * إلى مسار قوائم (يُعرض كسلسلة معزولة الاتجاه) وتعليمة نصية.
 * عشان خلط العربي والإنجليزي مع «←» ما يتلخبط في اتجاه RTL.
 */
export function splitStepPath(text: string): { path: string[]; rest: string } {
  if (!text.includes("←")) return { path: [], rest: text };
  const last = text.lastIndexOf("←");
  const colon = text.indexOf(":", last);
  const pathPart = colon === -1 ? text : text.slice(0, colon);
  const rest = colon === -1 ? "" : text.slice(colon + 1).trim();
  const path = pathPart
    .split("←")
    .map((s) => s.trim())
    .filter(Boolean);
  return { path, rest };
}
