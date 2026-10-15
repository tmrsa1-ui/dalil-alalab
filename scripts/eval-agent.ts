/**
 * تقييم الوكيل مقابل بطاقات مرجعية راجعها إنسان.
 * - يقرأ data/eval/holdout.json (أسماء فقط).
 * - يستخدم فقط العناوين اللي لها بطاقة مرجعية حقيقية (isDemo:false و human_reviewed).
 * - يشتغل فقط لو ENABLE_AI_CARDS=true و ANTHROPIC_API_KEY موجود (من .env.local).
 * - يكتب docs/EVALUATION.md بالأرقام الفعلية فقط، أو «لم يُشغَّل بعد».
 */
import fs from "node:fs";
import path from "node:path";
import { titleSchema, type Title } from "../schemas/title";
import { compareCards, summarize, type EvalRow } from "../src/lib/agent/eval";

function loadEnvLocal() {
  const f = path.resolve(".env.local");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
  }
}

const OUT = path.resolve("docs/EVALUATION.md");
const HEADER = `# تقييم الوكيل (البطاقات الآلية بمصادر)

> هذا الملف يُولَّد تلقائيًا بـ \`npm run eval:agent\`. لا يحتوي إلا أرقام قيست فعلًا.

## المنهجية
- قائمة التقييم: \`data/eval/holdout.json\` (أسماء فقط).
- المرجع: بطاقات في \`data/titles\` بحالة \`human_reviewed\` و \`isDemo: false\` (راجعها إنسان من المصادر الرسمية).
- المقاييس:
  - **صحة نقل التصنيف**: نسبة جهات التصنيف الخمس اللي قيمتها عند الوكيل = قيمتها في المرجع (بما فيها «غير متوفر» = «غير متوفر»).
  - **التقاط النقاط الخمس**: نسبة النقاط اللي حالتها عند الوكيل = حالتها في المرجع.
  - **صحة المصادر**: نسبة روابط الوكيل اللي من الـallowlist (والتصنيفات من صفحة الجهة نفسها).
  - **نسبة «ما لقيت»**: نسبة الحقول (5 تصنيفات + 5 نقاط) اللي تركها الوكيل فاضية.
`;

async function main() {
  loadEnvLocal();
  const holdout = JSON.parse(fs.readFileSync("data/eval/holdout.json", "utf8")) as {
    titles: Array<{ slug: string; nameEn: string }>;
  };
  const refs: Array<{ name: string; ref: Title }> = [];
  for (const t of holdout.titles) {
    const f = path.join("data/titles", `${t.slug}.json`);
    if (!fs.existsSync(f)) continue;
    const ref = titleSchema.parse(JSON.parse(fs.readFileSync(f, "utf8")));
    if (!ref.isDemo && ref.reviewStatus === "human_reviewed") refs.push({ name: t.nameEn, ref });
  }

  const enabled = process.env.ENABLE_AI_CARDS === "true" && !!process.env.ANTHROPIC_API_KEY;
  if (!enabled || refs.length === 0) {
    const reason = !enabled
      ? "الوكيل غير مفعّل في هذه البيئة (ENABLE_AI_CARDS / ANTHROPIC_API_KEY غير موجودين)."
      : "ما فيه بعد بطاقات مرجعية راجعها إنسان (isDemo:false + human_reviewed) لعناوين قائمة التقييم.";
    fs.writeFileSync(
      OUT,
      `${HEADER}\n## النتائج\n\n**لم يُشغَّل بعد.**\n\nالسبب: ${reason}\n\nعدد عناوين قائمة التقييم: ${holdout.titles.length}. عدد البطاقات المرجعية الجاهزة: ${refs.length}.\n`,
    );
    console.log(`✗ eval:agent لم يُشغَّل — ${reason}`);
    return;
  }

  const { createAnthropicLlm, createAnthropicJudge } = await import("../src/lib/agent/llm");
  const { generateCard } = await import("../src/lib/agent/pipeline");
  const llm = createAnthropicLlm();
  const judge = createAnthropicJudge(llm);
  const rows: EvalRow[] = [];
  const failures: string[] = [];
  for (const { name, ref } of refs) {
    try {
      const { title } = await generateCard(name, { llm, judge });
      rows.push(compareCards(ref, title));
      console.log(`✓ ${ref.slug}`);
    } catch (e) {
      failures.push(`${ref.slug}: ${(e as Error).message}`);
    }
  }
  const s = summarize(rows);
  const table = rows
    .map(
      (r) =>
        `| ${r.slug} | ${r.ratingsCorrect}/${r.ratingsTotal} | ${r.pointsCorrect}/${r.pointsTotal} | ${r.sourcesValid}/${r.sourcesTotal} | ${r.notFound}/${r.fieldsTotal} |`,
    )
    .join("\n");
  fs.writeFileSync(
    OUT,
    `${HEADER}
## النتائج (${new Date().toISOString().slice(0, 10)}، النموذج: ${process.env.ANTHROPIC_MODEL || "claude-opus-5-5"})

| المقياس | القيمة |
| --- | --- |
| عدد العناوين | ${s.titles} |
| صحة نقل التصنيف | ${s.ratingAccuracy} |
| التقاط النقاط الخمس | ${s.pointAccuracy} |
| صحة المصادر | ${s.sourceValidity} |
| نسبة «ما لقيت» | ${s.notFoundRate} |

| العنوان | التصنيفات | النقاط | المصادر | ما لقيت |
| --- | --- | --- | --- | --- |
${table}
${failures.length ? `\n### فشل التشغيل\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""}`,
  );
  console.log("✓ eval:agent — كُتب docs/EVALUATION.md");
}

void main();
