import { eventSchema, type AppEvent } from "../../schemas/event";

export type TrackInput = Omit<AppEvent, "ts" | "sessionId">;

/** يبني الحدث ويتحقق منه (strict: أي حقل زايد يُرفض). */
export function buildEvent(input: TrackInput, now: number, sessionId: string): AppEvent | null {
  const r = eventSchema.safeParse({ ...input, ts: now, sessionId });
  return r.success ? r.data : null;
}
