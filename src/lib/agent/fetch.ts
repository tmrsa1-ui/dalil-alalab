import { hostOf, isAllowedUrl } from "./allowlist";
import type { Identity, SourceDoc } from "./types";

/** روابط ثابتة على جهات التصنيف الرسمية (بحث داخل مواقعها فقط — لا محركات بحث عامة). */
export function authorityUrls(identity: Identity): string[] {
  const q = encodeURIComponent(identity.officialName);
  return [
    `https://www.esrb.org/search/?searchKeyword=${q}`,
    `https://pegi.info/search-pegi?q=${q}`,
    `https://itunes.apple.com/search?term=${q}&entity=software&country=sa&limit=3`,
    `https://play.google.com/store/search?q=${q}&c=apps&hl=en`,
  ];
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

const MAX_BYTES = 600_000;
const MAX_CHARS = 40_000;

/** المرحلة 2: جلب الصفحات من الـallowlist فقط (ويُرفض أي redirect لخارجها). */
export async function fetchSources(
  urls: string[],
  publisherUrl: string | null,
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
): Promise<SourceDoc[]> {
  const unique = [...new Set(urls)].filter((u) => isAllowedUrl(u, publisherUrl)).slice(0, 10);
  const docs = await Promise.all(
    unique.map(async (url): Promise<SourceDoc | null> => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12_000);
        const res = await fetchImpl(url, {
          signal: ctrl.signal,
          redirect: "follow",
          headers: { "user-agent": "DalilAlalabBot/0.1 (+parental guide; official sources only)" },
        });
        clearTimeout(timer);
        const finalUrl = res.url || url;
        if (!res.ok || !isAllowedUrl(finalUrl, publisherUrl)) return null;
        const body = (await res.text()).slice(0, MAX_BYTES);
        const type = res.headers.get("content-type") ?? "";
        const text = (type.includes("json") ? body : htmlToText(body)).slice(0, MAX_CHARS);
        const title =
          body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || hostOf(finalUrl) || finalUrl;
        return text
          ? { url: finalUrl, title, text, fetchedAt: now.toISOString().slice(0, 10) }
          : null;
      } catch {
        return null;
      }
    }),
  );
  return docs.filter((d): d is SourceDoc => d !== null);
}
