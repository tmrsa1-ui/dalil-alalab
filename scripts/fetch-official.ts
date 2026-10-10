/**
 * يجلب الصفحات الرسمية (App Store السعودي، Google Play بمنطقة السعودية، وصفحات الرقابة الأبوية
 * للناشرين) ويحفظ مقتطفات حرفية + الرابط + تاريخ الجلب في research/official_snapshot.json.
 * لا يكتب في data/ — الخطوة الثانية (apply-official) هي اللي تطبّق القواعد.
 *
 * الاستخدام: NODE_USE_ENV_PROXY=1 npm run fetch:official
 */
import fs from "node:fs";
import path from "node:path";
import { isAllowedUrl } from "../src/lib/agent/allowlist";

type Cfg = {
  titles: Record<
    string,
    {
      appStoreId: string | null;
      playPackage: string | null;
      expect: string;
      guides: string[];
      psGameSlug?: string;
      psExpect?: string;
      xboxProductId?: string;
      xboxExpect?: string;
    }
  >;
  platformGuides?: Record<string, string>;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<{ status: number; finalUrl: string; body: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, "accept-language": "en" },
        redirect: "follow",
        signal: AbortSignal.timeout(25_000),
      });
      return { status: res.status, finalUrl: res.url || url, body: await res.text() };
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return { status: 0, finalUrl: url, body: "" };
}

const unescapeJson = (s: string) => {
  try {
    return JSON.parse(`"${s}"`) as string;
  } catch {
    return s;
  }
};
const strip = (s: string) =>
  s
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

function annotation(body: string, title: string): { summary: string | null; raw: string | null } {
  const i = body.indexOf(`"$kind":"Annotation","title":"${title}","summary":"`);
  if (i < 0) return { summary: null, raw: null };
  const rest = body.slice(i);
  const summary = rest.match(/"summary":"((?:[^"\\]|\\.)*)"/)?.[1] ?? null;
  const end = rest.indexOf(`"$kind":"Annotation"`, 30);
  const block = end > 0 ? rest.slice(0, end) : rest.slice(0, 4000);
  const raw = block.match(/"rawText":"((?:[^"\\]|\\.)*)"/)?.[1] ?? null;
  return { summary: summary && unescapeJson(summary), raw: raw && unescapeJson(raw) };
}

async function appStore(id: string) {
  const url = `https://apps.apple.com/sa/app/id${id}`;
  const r = await get(`${url}?l=en`);
  if (r.status !== 200) return { url, fetchedAt: today, status: r.status };
  const age = annotation(r.body, "Age Rating");
  const iap = annotation(r.body, "In-App Purchases");
  const provider = annotation(r.body, "Provider");
  const name = strip(r.body.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
  return {
    url,
    fetchedAt: today,
    status: r.status,
    pageTitle: name,
    provider: provider.summary,
    ageRating: age.summary,
    ageRatingDetails: age.raw,
    inAppPurchases: iap.summary,
  };
}

async function googlePlay(pkg: string) {
  const url = `https://play.google.com/store/apps/details?id=${pkg}&hl=en&gl=SA`;
  const r = await get(url);
  if (r.status !== 200) return { url, fetchedAt: today, status: r.status };
  // كتلة التصنيف الظاهرة للمستخدم في متجر السعودية: صورة الشارة + القيمة + الأسطر.
  const block = r.body.match(
    /<img src="([^"]+)"[^>]*alt="Content rating"[^>]*\/><div class="kBnsrd"><div class="D0xdTe">([^<]+)<\/div>((?:<div class="JHmoid">[^<]*<\/div>)*)/,
  );
  const badgeSrc = block?.[1] ?? null;
  const ratingBody = badgeSrc && /Gmedia_/i.test(badgeSrc) ? "Gmedia" : block ? "IARC" : null;
  const lines = block
    ? [...block[3]!.matchAll(/>([^<]+)</g)].map((x) => strip(x[1]!)).filter(Boolean)
    : [];
  const ratedFor = block ? strip(block[2]!) : null;
  const text = strip(r.body);
  const title = strip(r.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  const developer = strip(
    r.body.match(/<div class="Vbfug[^"]*"><a[^>]*><span>([^<]+)<\/span>/)?.[1] ?? "",
  );
  return {
    url,
    fetchedAt: today,
    status: r.status,
    pageTitle: title,
    developer: developer || null,
    ratingBody,
    badgeSrc,
    ratedFor,
    ratingLines: lines,
    containsAds: /\bContains ads\b/.test(text),
    inAppPurchasesLabel: /\bIn-app purchases\b/.test(text),
  };
}

/** صفحة اللعبة في PlayStation (السعودية): تصنيف «المفهوم» الظاهر في الصفحة. */
async function playstation(slug: string) {
  const url = `https://www.playstation.com/en-sa/games/${slug}/`;
  const r = await get(url);
  if (r.status !== 200) return { url, fetchedAt: today, status: r.status };
  const pageTitle = strip(r.body.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "");
  const m = r.body.match(
    /"Concept:\d+":\{"id":"\d+","__typename":"Concept","contentRating":(\{.*?\})(?=,"defaultProduct"|\})/,
  );
  let cr: {
    authority?: string;
    description?: string;
    name?: string;
    descriptors?: Array<{ description: string }>;
    interactiveElements?: Array<{ description: string }>;
  } | null = null;
  try {
    cr = m ? JSON.parse(m[1]!) : null;
  } catch {
    cr = null;
  }
  return {
    url,
    fetchedAt: today,
    status: r.status,
    pageTitle,
    authority: cr?.authority ?? null,
    ratingDescription: cr?.description ?? null,
    ratingName: cr?.name ?? null,
    descriptors: (cr?.descriptors ?? []).map((d) => d.description),
    interactive: (cr?.interactiveElements ?? []).map((d) => d.description),
  };
}

/** صفحة المنتج في متجر Xbox (السعودية): بيانات المنتج من الحالة المحمّلة مسبقًا. */
async function xbox(productId: string) {
  const url = `https://www.xbox.com/ar-SA/games/store/_/${productId}`;
  const r = await get(url);
  if (r.status !== 200) return { url, fetchedAt: today, status: r.status };
  try {
    const i = r.body.indexOf("window.__PRELOADED_STATE__");
    const j = r.body.indexOf("=", i) + 1;
    const text = r.body.slice(j).trimStart();
    // نقرأ أول كائن JSON كامل فقط.
    let depth = 0;
    let end = 0;
    let inStr = false;
    for (let k = 0; k < text.length; k++) {
      const c = text[k];
      if (inStr) {
        if (c === "\\") k++;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        end = k + 1;
        break;
      }
    }
    const state = JSON.parse(text.slice(0, end));
    const p = state.core2.products.productSummaries[productId];
    const cr = p?.contentRating ?? {};
    return {
      url,
      fetchedAt: today,
      status: r.status,
      pageTitle: p?.title ?? null,
      boardName: cr.boardName ?? null,
      rating: cr.rating ?? null,
      ratingDescription: cr.description ?? null,
      descriptors: cr.descriptors ?? [],
      interactive: cr.interactiveDescriptions ?? [],
    };
  } catch {
    return { url, fetchedAt: today, status: -2 };
  }
}

async function guide(url: string) {
  if (!isAllowedUrl(url)) return { url, status: -1, reason: "خارج النطاقات الرسمية" };
  const r = await get(url);
  const pageTitle = strip(r.body.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "").slice(0, 160);
  const metaDesc =
    r.body.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/)?.[1] ??
    r.body.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/)?.[1] ??
    null;
  return {
    url,
    fetchedAt: today,
    status: r.status,
    finalUrl: r.finalUrl,
    metaDescription: metaDesc ? strip(metaDesc) : null,
    finalAllowed: isAllowedUrl(r.finalUrl),
    pageTitle,
    mentionsParental: /parent|family|guardian|teen account|child account/i.test(
      strip(r.body).slice(0, 200_000),
    ),
  };
}

async function main() {
  const cfg = JSON.parse(fs.readFileSync("research/official_sources.json", "utf8")) as Cfg;
  const out: Record<string, unknown> = {};
  // لو فشل الجلب الحالي (مثل 429)، نبقي آخر جلب ناجح لنفس المصدر.
  const prevFile = path.resolve("research/official_snapshot.json");
  const prev = fs.existsSync(prevFile)
    ? (JSON.parse(fs.readFileSync(prevFile, "utf8")).titles as Record<
        string,
        Record<string, unknown>
      >)
    : {};
  const keep = <T extends { status?: number } | null>(fresh: T, old: unknown): T =>
    fresh && fresh.status !== 200 && (old as { status?: number } | null)?.status === 200
      ? (old as T)
      : fresh;
  for (const [slug, c] of Object.entries(cfg.titles)) {
    const entry = {
      expect: c.expect,
      appStore: keep(c.appStoreId ? await appStore(c.appStoreId) : null, prev[slug]?.appStore),
      googlePlay: keep(
        c.playPackage ? await googlePlay(c.playPackage) : null,
        prev[slug]?.googlePlay,
      ),
      playstation: keep(
        c.psGameSlug ? await playstation(c.psGameSlug) : null,
        prev[slug]?.playstation,
      ),
      psExpect: c.psExpect ?? c.expect,
      xbox: keep(c.xboxProductId ? await xbox(c.xboxProductId) : null, prev[slug]?.xbox),
      xboxExpect: c.xboxExpect ?? c.expect,
      guides: [] as unknown[],
    };
    for (const g of c.guides) entry.guides.push(await guide(g));
    out[slug] = entry;
    console.log(
      `${slug}: AS=${(entry.appStore as { ageRating?: string } | null)?.ageRating ?? "—"} GP=${(entry.googlePlay as { ratedFor?: string } | null)?.ratedFor ?? "—"} PS=${(entry.playstation as { ratingDescription?: string } | null)?.ratingDescription ?? "—"} XB=${(entry.xbox as { boardName?: string; rating?: string } | null)?.boardName ?? "—"}:${(entry.xbox as { rating?: string } | null)?.rating ?? ""} guides=${entry.guides.map((g) => (g as { status: number }).status).join(",")}`,
    );
    await sleep(800);
  }
  const platformGuides: Record<string, unknown> = {};
  for (const [id, url] of Object.entries(cfg.platformGuides ?? {})) {
    platformGuides[id] = await guide(url);
    console.log(`guide ${id}: ${(platformGuides[id] as { status: number }).status}`);
  }
  fs.writeFileSync(
    path.resolve("research/official_snapshot.json"),
    JSON.stringify(
      { fetchedAt: today, method: "fetch-official.ts", titles: out, platformGuides },
      null,
      2,
    ) + "\n",
  );
  console.log("✓ fetch:official — research/official_snapshot.json");
}

void main();
