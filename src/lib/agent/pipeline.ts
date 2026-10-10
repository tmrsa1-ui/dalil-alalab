import { identify } from "./identify";
import { authorityUrls, fetchSources } from "./fetch";
import { extract } from "./extract";
import { verifyCard, type VerifyReport } from "./verify";
import type { AgentLlm, Judge } from "./types";
import type { Title } from "../../../schemas/title";

export function slugify(s: string): string {
  const base = s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "title";
}

/** يربط المراحل الأربع. لا يُرسل أي شي عن الطفل: فقط اسم العنوان. */
export async function generateCard(
  name: string,
  deps: { llm: AgentLlm; judge?: Judge; fetchImpl?: typeof fetch },
): Promise<{ title: Title; report: VerifyReport; sourcesFetched: number }> {
  const identity = await identify(name, deps.llm);
  const docs = await fetchSources(
    [...authorityUrls(identity), ...identity.candidateUrls],
    identity.publisherUrl,
    deps.fetchImpl,
  );
  const isArabic = /[؀-ۿ]/.test(name);
  const nameAr = identity.nameAr || (isArabic ? name.trim() : identity.officialName);
  const slug = slugify(identity.officialName);
  if (docs.length === 0) {
    const { title, report } = await verifyCard(
      { slug, nameAr, identity, extracted: emptyExtraction(), docs },
      deps.judge,
    );
    return { title, report, sourcesFetched: 0 };
  }
  const extracted = await extract(identity, docs, deps.llm);
  const { title, report } = await verifyCard({ slug, nameAr, identity, extracted, docs }, deps.judge);
  return { title, report, sourcesFetched: docs.length };
}

function emptyExtraction() {
  const r = { value: null, quote: null, sourceUrl: null };
  const p = { status: "unknown" as const, summaryAr: "", quote: null, sourceUrl: null };
  const l = { status: "unknown" as const, noteAr: "", quote: null, sourceUrl: null };
  return {
    ratings: { gcam: r, esrb: r, pegi: r, appStore: r, googlePlay: r },
    attentionPoints: { strangerChat: p, purchases: p, content: p, ads: p, sessionPause: p },
    familyLens: { gambling: l, mixedVoiceChat: l, magic: l, clothing: l, music: l },
    prayerPause: { status: "unknown" as const, noteAr: "", quote: null, sourceUrl: null },
  };
}
