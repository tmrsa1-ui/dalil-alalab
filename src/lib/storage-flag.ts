import "server-only";

/** هل فيه مكان يُحفظ فيه طلب الإضافة؟ (Supabase، أو ملف محلي في التطوير.) */
export function isRequestStorageEnabled(): boolean {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) return true;
  return process.env.NODE_ENV !== "production" || process.env.DALIL_LOCAL_SINK === "1";
}
