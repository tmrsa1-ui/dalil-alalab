import { FORBIDDEN_LIST } from "../forbidden-words";
import {
  extractedCardSchema,
  type AgentLlm,
  type ExtractedCard,
  type Identity,
  type SourceDoc,
} from "./types";

const SYSTEM =
  () => `You fill a parental guide card for a game/app STRICTLY from the provided source documents.
Rules:
- Every non-unknown field MUST include "quote": an exact, verbatim substring copied from ONE document,
  and "sourceUrl": that document's URL exactly as given. Do not paraphrase quotes.
- If the documents do not state something, use status "unknown" (or value null) with quote and sourceUrl null.
- Age ratings: only fill a rating if the rating value appears verbatim in a quote from that rating
  authority's own page (ESRB → esrb.org, PEGI → pegi.info, App Store → apple.com, Google Play →
  play.google.com, GCAM → gcam.gov.sa). Never infer one rating from another.
- summaryAr / noteAr: at most two short sentences in neutral Arabic, descriptive, no judgement, no fear,
  and never use any of these words: ${FORBIDDEN_LIST.join(", ")} (or English "safe").
- Never add numbers or statistics that are not in the quote.`;

/** المرحلة 3: استخراج منظّم مع اقتباس حرفي ورابط لكل حقل. */
export async function extract(
  identity: Identity,
  docs: SourceDoc[],
  llm: AgentLlm,
): Promise<ExtractedCard> {
  const docsText = docs
    .map((d, i) => `<document index="${i}" url="${d.url}">\n${d.text}\n</document>`)
    .join("\n\n");
  const raw = await llm.json({
    system: SYSTEM(),
    prompt: `Title: ${identity.officialName}\n\n${docsText}\n\nFill the card JSON.`,
    schema: extractedCardSchema,
    maxTokens: 8000,
  });
  return extractedCardSchema.parse(raw);
}
