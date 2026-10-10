import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { titleSchema, type Title } from "@schemas/title";
import { clientKey, rateLimit, takeDailyBudget } from "@/lib/server/rate-limit";
import { compactKey } from "@/lib/normalize-ar";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const body = z.object({ name: z.string().trim().min(2).max(80) }).strict();
const cache = new Map<string, { title: Title; at: number }>();
const TTL = 1000 * 60 * 60 * 24 * 7;

function aiEnabled() {
  return process.env.ENABLE_AI_CARDS === "true" && !!process.env.ANTHROPIC_API_KEY;
}

async function persist(title: Title, report: unknown) {
  // cache + قائمة مراجعة بشرية. على الاستضافات اللي نظام ملفاتها للقراءة فقط نتجاهل بهدوء.
  try {
    const dir = path.join(process.cwd(), "data", "review-queue");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${title.slug}.json`),
      JSON.stringify({ queuedAt: new Date().toISOString(), report, title }, null, 2) + "\n",
    );
  } catch {
    // ignore
  }
}

export async function POST(req: Request) {
  if (!aiEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        message: "البطاقات الآلية غير مفعّلة حاليًا. تقدر تطلب إضافة العنوان وبنراجعه.",
      },
      { status: 503 },
    );
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, message: "اسم غير صالح." }, { status: 400 });
  const key = compactKey(parsed.data.name);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL)
    return NextResponse.json({ ok: true, cached: true, title: hit.title });

  if (!rateLimit(clientKey(req, "ai"), 3, 60 * 60_000)) {
    return NextResponse.json(
      { ok: false, message: "وصلت الحد المسموح، جرّب بعد ساعة." },
      { status: 429 },
    );
  }
  const max = Number(process.env.MAX_AI_CARDS_PER_DAY ?? 20) || 20;
  if (!takeDailyBudget(max)) {
    return NextResponse.json(
      { ok: false, message: "وصلنا حد اليوم للبطاقات الآلية. جرّب بكرة." },
      { status: 429 },
    );
  }

  try {
    const { createAnthropicLlm, createAnthropicJudge } = await import("@/lib/agent/llm");
    const { generateCard } = await import("@/lib/agent/pipeline");
    const llm = createAnthropicLlm();
    // فقط اسم العنوان يُرسل للنموذج — لا عمر ولا أي شي عن الطفل.
    const { title, report } = await generateCard(parsed.data.name, {
      llm,
      judge: createAnthropicJudge(llm),
    });
    const safeTitle = titleSchema.parse(title);
    cache.set(key, { title: safeTitle, at: Date.now() });
    await persist(safeTitle, report);
    return NextResponse.json({ ok: true, cached: false, title: safeTitle });
  } catch {
    return NextResponse.json(
      { ok: false, message: "ما قدرنا نولّد البطاقة الحين." },
      { status: 502 },
    );
  }
}
