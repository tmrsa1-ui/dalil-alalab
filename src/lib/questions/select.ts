import type { AgeBand, PointKey } from "../../../schemas/common";
import { POINT_KEYS } from "@schemas/keys";
import type { ConversationQuestion } from "../../../schemas/questions";
import type { Title } from "../../../schemas/title";
import { hashString } from "../hash";

const STATUS_WEIGHT = { present: 3, configurable: 2, unknown: 1, absent: 0 } as const;

/**
 * يرتّب النقاط الخمس حسب أهميتها في البطاقة:
 * أولًا الوسوم اللي حددها المراجع (conversationTags)، ثم حسب الحالة، ثم الترتيب الثابت.
 */
export function rankPoints(title: Pick<Title, "attentionPoints" | "conversationTags">): PointKey[] {
  const tags = title.conversationTags;
  return [...POINT_KEYS].sort((a, b) => {
    const ta = tags.indexOf(a);
    const tb = tags.indexOf(b);
    if (ta !== -1 || tb !== -1) {
      if (ta === -1) return 1;
      if (tb === -1) return -1;
      return ta - tb;
    }
    const wa = STATUS_WEIGHT[title.attentionPoints[a].status];
    const wb = STATUS_WEIGHT[title.attentionPoints[b].status];
    if (wa !== wb) return wb - wa;
    return POINT_KEYS.indexOf(a) - POINT_KEYS.indexOf(b);
  });
}

function pick<T>(pool: T[], seed: string): T | undefined {
  if (pool.length === 0) return undefined;
  return pool[hashString(seed) % pool.length];
}

/**
 * يختار 3 أسئلة بالضبط: سؤال «الأصحاب» دائمًا + سؤالين لأعلى نقطتين انتباه.
 * deterministic: نفس (العنوان، الفئة العمرية، variant) ⇒ نفس الأسئلة.
 * variant يزيد مع زر «أسئلة غيرها».
 */
export function selectQuestions(
  bank: ConversationQuestion[],
  opts: { slug: string; ageBand: AgeBand; points: PointKey[]; variant?: number },
): ConversationQuestion[] {
  const { slug, ageBand, variant = 0 } = opts;
  const inBand = bank.filter((q) => q.ageBand === ageBand);
  const friends = pick(
    inBand.filter((q) => q.pointKey === "friends"),
    `${slug}|${ageBand}|friends|${variant}`,
  );

  const chosen: ConversationQuestion[] = [];
  const order = [...opts.points, ...POINT_KEYS.filter((k) => !opts.points.includes(k))];
  for (const key of order) {
    if (chosen.length === 2) break;
    const q = pick(
      inBand.filter((x) => x.pointKey === key),
      `${slug}|${ageBand}|${key}|${variant}`,
    );
    if (q) chosen.push(q);
  }
  return friends ? [friends, ...chosen] : chosen;
}
