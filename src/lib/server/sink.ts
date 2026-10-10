import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type Table = "events" | "title_requests" | "feedback" | "card_cache";
export type SinkResult = "supabase" | "file" | "disabled" | "error";

const LOCAL_DIR = path.join(process.cwd(), ".data");

/**
 * Adapter التخزين:
 * - SUPABASE_URL + SUPABASE_ANON_KEY ⇒ إدراج عبر REST (RLS: insert فقط).
 * - غير ذلك في التطوير ⇒ ملف NDJSON محلي في .data/
 * - غير ذلك في الإنتاج ⇒ تعطيل هادئ (لا شي يُخزن).
 */
export async function insert(table: Table, row: Record<string, unknown>): Promise<SinkResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(row),
        cache: "no-store",
      });
      return res.ok ? "supabase" : "error";
    } catch {
      return "error";
    }
  }
  if (process.env.NODE_ENV !== "production" || process.env.DALIL_LOCAL_SINK === "1") {
    try {
      await fs.mkdir(LOCAL_DIR, { recursive: true });
      await fs.appendFile(path.join(LOCAL_DIR, `${table}.ndjson`), JSON.stringify(row) + "\n");
      return "file";
    } catch {
      return "error";
    }
  }
  return "disabled";
}

/** يقرأ الملف المحلي (للتطوير وصفحة الأثر فقط). */
export async function readLocal(table: Table): Promise<Record<string, unknown>[]> {
  try {
    const raw = await fs.readFile(path.join(LOCAL_DIR, `${table}.ndjson`), "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Record<string, unknown>);
  } catch {
    return [];
  }
}
