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
      esrbQuery?: string;
      esrbTitle?: string;
      esrbId?: string;
      pegiQuery?: string;
      pegiTitle?: string;
    }
  >;
  platformGuides?: Record<string, string>;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(
  url: string,
  extra: { referer?: string } = {},
): Promise<{ status: number; finalUrl: string; body: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          ...(extra.referer ? { referer: extra.referer } : {}),
        },
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

const normTitle = (t: string) =>
  t.replace(/[™®]/g, "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();

/** نتائج بحث ESRB: نختار الإصدار اللي عنوانه يطابق حرفيًا (أحدث رقم، أو رقم محدد). */
async function esrb(query: string, title: string, id?: string) {
  const searchUrl = `https://www.esrb.org/search/?searchKeyword=${encodeURIComponent(query)}`;
  const r = await get(searchUrl);
  if (r.status !== 200) return { url: searchUrl, fetchedAt: today, status: r.status };
  const games = r.body
    .split('<div class="game">')
    .slice(1)
    .map((g) => {
      const t = g.match(/<h2><a href="([^"]+)">([\s\S]*?)<\/a>/);
      const cells = [...g.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => m[1]!);
      return {
        url: t?.[1] ?? "",
        title: strip(t?.[2] ?? ""),
        platforms: strip(g.match(/class="platforms">([\s\S]*?)<\/div>/)?.[1] ?? ""),
        rating: cells[0]?.match(/alt="([^"]+)"/)?.[1] ?? null,
        descriptors: strip(cells[1] ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        interactive: [...(cells[2] ?? "").matchAll(/<p>([\s\S]*?)<\/p>/g)]
          .map((m) => strip(m[1]!).replace(/\s*\([^)]*\)\s*$/, ""))
          .filter(Boolean),
        synopsis: strip(cells[3] ?? ""),
      };
    });
  const matches = games.filter(
    (g) => normTitle(g.title) === normTitle(title) && (!id || g.url.includes(`/ratings/${id}/`)),
  );
  const num = (u: string) => Number(u.match(/ratings\/(\d+)\//)?.[1] ?? 0);
  const best = matches.sort((a, b) => num(b.url) - num(a.url))[0];
  if (!best)
    return {
      url: searchUrl,
      fetchedAt: today,
      status: 404,
      candidates: games.map((g) => g.title).slice(0, 8),
    };
  const quote = best.synopsis.match(/^.*?by the ESRB[^.]*\./)?.[0] ?? null;
  return { ...best, fetchedAt: today, status: 200, pageTitle: best.title, quote };
}

/** قاعدة بيانات PEGI: أول نتيجة عنوانها يطابق حرفيًا (النتائج مرتبة من الأحدث). */
async function pegi(query: string, title: string) {
  const url = `https://pegi.info/search-pegi?q=${encodeURIComponent(query)}&op=Search`;
  const r = await get(url, { referer: "https://pegi.info/" });
  if (r.status !== 200) return { url, fetchedAt: today, status: r.status };
  const main = r.body.slice(r.body.indexOf('id="results"'));
  const games = main
    .split('<article class="game">')
    .slice(1)
    .map((a) => ({
      title: strip(a.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? ""),
      publisher: strip(a.match(/class="publisher">([\s\S]*?)<\/span>/)?.[1] ?? ""),
      rating: a.match(/alt="age rating ([^"]+)"/)?.[1] ?? null,
      descriptors: [...a.matchAll(/category_threshold_icons\/[^"]+" alt="([^"]+)"/g)].map(
        (m) => m[1]!,
      ),
      platforms: [...a.matchAll(/<div class="icon-[^"]*">([\s\S]*?)<\/div>/g)].map((m) =>
        strip(m[1]!),
      ),
      advice: strip(a.match(/Advice for consumers<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1] ?? ""),
    }));
  const best = games.find((g) => normTitle(g.title) === normTitle(title));
  if (!best)
    return {
      url,
      fetchedAt: today,
      status: 404,
      candidates: games.map((g) => g.title).slice(0, 8),
    };
  const quote =
    best.advice.match(/^[^.]*PEGI[^.]*\./)?.[0] ??
    (best.rating ? `age rating ${best.rating}` : null);
  return { url, fetchedAt: today, status: 200, pageTitle: best.title, ...best, quote };
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
      esrb: keep(
        c.esrbQuery && c.esrbTitle ? await esrb(c.esrbQuery, c.esrbTitle, c.esrbId) : null,
        prev[slug]?.esrb,
      ),
      pegi: keep(
        c.pegiQuery && c.pegiTitle ? await pegi(c.pegiQuery, c.pegiTitle) : null,
        prev[slug]?.pegi,
      ),
      guides: [] as unknown[],
    };
    for (const g of c.guides) entry.guides.push(await guide(g));
    out[slug] = entry;
    console.log(
      `${slug}: AS=${(entry.appStore as { ageRating?: string } | null)?.ageRating ?? "—"} GP=${(entry.googlePlay as { ratedFor?: string } | null)?.ratedFor ?? "—"} PS=${(entry.playstation as { ratingDescription?: string } | null)?.ratingDescription ?? "—"} XB=${(entry.xbox as { boardName?: string; rating?: string } | null)?.boardName ?? "—"}:${(entry.xbox as { rating?: string } | null)?.rating ?? ""} ESRB=${(entry.esrb as { rating?: string } | null)?.rating ?? "—"} PEGI=${(entry.pegi as { rating?: string } | null)?.rating ?? "—"} guides=${entry.guides.map((g) => (g as { status: number }).status).join(",")}`,
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
