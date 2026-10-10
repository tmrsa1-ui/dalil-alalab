import { identitySchema, type AgentLlm, type Identity } from "./types";
import { isAllowedUrl } from "./allowlist";

const SYSTEM = `You identify a video game or app by name. Return only facts you are confident about.
If unsure about any field, use null or an empty list. Never invent URLs: only include official pages
on these domains: esrb.org, pegi.info, apps.apple.com, play.google.com, gcam.gov.sa, or the publisher's
official website.`;

/** المرحلة 1: تحديد العنوان الرسمي والمنصات والناشر. يُرسل اسم العنوان فقط. */
export async function identify(name: string, llm: AgentLlm): Promise<Identity> {
  const raw = await llm.json({
    system: SYSTEM,
    prompt: `Title name as typed by a parent (may be Arabic or English): ${JSON.stringify(name.slice(0, 80))}`,
    schema: identitySchema,
    maxTokens: 2000,
  });
  const id = identitySchema.parse(raw);
  const publisherUrl = id.publisherUrl && /^https:\/\//.test(id.publisherUrl) ? id.publisherUrl : null;
  return {
    ...id,
    publisherUrl,
    candidateUrls: id.candidateUrls.filter((u) => isAllowedUrl(u, publisherUrl)).slice(0, 8),
  };
}
