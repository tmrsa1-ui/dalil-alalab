import { NextResponse } from "next/server";
import { z } from "zod";
import { insert } from "@/lib/server/sink";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const body = z.object({ name: z.string().trim().min(1).max(80) }).strict();

/** طلب إضافة عنوان: يُرسل اسم العنوان فقط، بفعل صريح من الأب. */
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "request"), 10, 60_000)) {
    return NextResponse.json({ ok: false, message: "طلبات كثيرة، جرّب بعد شوي." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await insert("title_requests", { name: parsed.data.name, ts: new Date().toISOString() });
  return NextResponse.json({ ok: result !== "error", stored: result !== "disabled" }, { status: result === "error" ? 502 : 200 });
}
