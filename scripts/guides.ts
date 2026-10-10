/**
 * خطوات الأجهزة من أدلة الرقابة الأبوية الرسمية.
 *   fetch: يجلب صفحات الأدلة ويحفظ نصها في research/guides_snapshot.json
 *   apply: يتحقق إن كل اقتباس في research/guide_steps.json موجود حرفيًا في نص صفحته،
 *          ثم يكتب الخطوات في data/platforms/<id>.json (confidence: auto = بحاجة مراجعة بشرية).
 *          الخطوة اللي اقتباسها ما انلقى تُرفض وتنكتب في التقرير.
 * الاستخدام: npm run fetch:guides  |  npm run apply:guides [-- --dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { htmlToText, quoteInText } from "../src/lib/data/guide-text";
import { platformSchema, type Platform } from "../schemas/platform";
import { findForbiddenWord } from "../src/lib/forbidden-words";

type StepIn = {
  platform: string;
  pointKey: string;
  sourceUrl: string;
  stepAr: string;
  quote: string;
};
type Snapshot = Record<string, { fetchedAt: string; status: number; text: string }>;

const ROOT = process.cwd();
const STEPS = join(ROOT, "research/guide_steps.json");
const SNAP = join(ROOT, "research/guides_snapshot.json");
const UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const today = () => new Date().toISOString().slice(0, 10);
const steps = (JSON.parse(readFileSync(STEPS, "utf8")) as { steps: StepIn[] }).steps;

async function fetchAll() {
  const urls = [...new Set(steps.map((s) => s.sourceUrl))];
  const snap: Snapshot = {};
  for (const url of urls) {
    let status = 0;
    let text = "";
    for (let i = 0; i < 3 && status !== 200; i++) {
      try {
        const res = await fetch(url, {
          headers: {
            "user-agent": UA,
            accept: "text/html,application/xhtml+xml",
            "accept-language": "ar-SA,ar;q=0.9,en;q=0.8",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(30_000),
        });
        status = res.status;
        text = htmlToText(await res.text());
      } catch {
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
    }
    snap[url] = { fetchedAt: today(), status, text };
    console.log(`${status} ${url} (${text.length} حرف)`);
  }
  writeFileSync(SNAP, JSON.stringify(snap, null, 2) + "\n");
  console.log("✓ fetch:guides — research/guides_snapshot.json");
}

function applyAll(dry: boolean) {
  const snap = JSON.parse(readFileSync(SNAP, "utf8")) as Snapshot;
  const report: string[] = [
    "# تقرير خطوات الأجهزة (apply:guides)",
    "",
    "كل خطوة لازم اقتباسها يكون موجود حرفيًا في نص صفحة الدليل الرسمي (بعد توحيد المسافات وعلامات التنصيص).",
    "",
    "| الجهاز | النقطة | النتيجة | الاقتباس |",
    "| --- | --- | --- | --- |",
  ];
  const byPlatform = new Map<string, StepIn[]>();
  for (const s of steps) {
    const page = snap[s.sourceUrl];
    const ok = !!page && page.status === 200 && quoteInText(s.quote, page.text);
    const bad = findForbiddenWord(s.stepAr) ?? findForbiddenWord(s.quote, { english: true });
    const verdict = !ok ? "رُفضت: الاقتباس ما انلقى" : bad ? `رُفضت: كلمة ممنوعة «${bad}»` : "قُبلت";
    report.push(`| ${s.platform} | ${s.pointKey} | ${verdict} | ${s.quote.replace(/\|/g, "/")} |`);
    if (ok && !bad) byPlatform.set(s.platform, [...(byPlatform.get(s.platform) ?? []), s]);
  }
  let written = 0;
  for (const [id, list] of byPlatform) {
    const file = join(ROOT, "data/platforms", `${id}.json`);
    const p = JSON.parse(readFileSync(file, "utf8")) as Platform;
    const count: Record<string, number> = {};
    p.steps = list.map((s) => {
      count[s.pointKey] = (count[s.pointKey] ?? 0) + 1;
      return {
        id: `${id}-${s.pointKey.toLowerCase()}-${count[s.pointKey]}`,
        pointKey: s.pointKey as Platform["steps"][number]["pointKey"],
        stepAr: s.stepAr,
        sourceUrl: s.sourceUrl,
        verifiedAt: snap[s.sourceUrl]!.fetchedAt,
        quote: s.quote,
        confidence: "auto" as const,
        isDemo: false,
      };
    });
    const parsed = platformSchema.safeParse(p);
    if (!parsed.success) {
      console.error(id, parsed.error.issues);
      process.exit(1);
    }
    if (!dry) writeFileSync(file, JSON.stringify(p, null, 2) + "\n");
    written += list.length;
  }
  writeFileSync(join(ROOT, "research/guides-report.md"), report.join("\n") + "\n");
  console.log(
    `✓ apply:guides — ${written} خطوة من ${steps.length}${dry ? " (تجربة، ما انكتب شي)" : ""}`,
  );
}

const mode = process.argv[2];
if (mode === "fetch") await fetchAll();
else if (mode === "apply") applyAll(process.argv.includes("--dry"));
else {
  console.error("الاستخدام: tsx scripts/guides.ts fetch|apply [--dry]");
  process.exit(1);
}
