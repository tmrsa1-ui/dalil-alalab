import { NextResponse } from "next/server";
import { eventSchema } from "@schemas/event";
import { insert } from "@/lib/server/sink";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "events"), 120, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const text = await req.text();
  if (text.length > 4_000) return NextResponse.json({ ok: false }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const e = parsed.data;
  // لا IP ولا user agent. نخزن الحدث كما هو بعد التحقق.
  const row = {
    type: e.type,
    title_slug: e.titleSlug ?? null,
    age_band: e.ageBand ?? null,
    platform: e.platform ?? null,
    step: e.step ?? null,
    control_key: e.controlKey ?? null,
    found: e.found ?? null,
    session_id: e.sessionId,
    ts: new Date(e.ts).toISOString(),
  };
  const results = [await insert("events", row)];
  if (e.type === "feedback" && e.feedback) {
    results.push(
      await insert("feedback", {
        useful: e.feedback.useful,
        talked: e.feedback.talked,
        will_use_again: e.feedback.willUseAgain,
        parent_note: e.feedback.parentNote ?? null,
        title_slug: e.titleSlug ?? null,
        ts: row.ts,
      }),
    );
  }
  return new NextResponse(null, { status: results.includes("error") ? 502 : 204 });
}
