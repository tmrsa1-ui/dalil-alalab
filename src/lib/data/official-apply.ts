/**
 * يطبّق لقطة الصفحات الرسمية (research/official_snapshot.json) على بطاقة عنوان.
 * كل قيمة: رابط رسمي + اقتباس حرفي من الصفحة + تاريخ الجلب + confidence "auto" (بحاجة مراجعة بشرية).
 * لا يكتب فوق قيمة راجعها إنسان. لا يستنتج شي ما هو مكتوب في الصفحة.
 */
import type { Title, RatingKey } from "../../../schemas/title";
import type { PointKey } from "../../../schemas/common";

export type StoreSnapshot = {
  url: string;
  fetchedAt: string;
  status?: number;
  pageTitle?: string;
  provider?: string | null;
  ageRating?: string | null;
  ageRatingDetails?: string | null;
  inAppPurchases?: string | null;
  developer?: string | null;
  ratingBody?: "Gmedia" | "IARC" | null;
  badgeSrc?: string | null;
  ratedFor?: string | null;
  ratingLines?: string[];
  containsAds?: boolean;
};

export type ConsoleSnapshot = {
  url: string;
  fetchedAt: string;
  status?: number;
  pageTitle?: string | null;
  /** PlayStation: GCAM / PEGI / Generic */
  authority?: string | null;
  ratingName?: string | null;
  /** Xbox: GAMR / PEGI */
  boardName?: string | null;
  rating?: string | null;
  ratingDescription?: string | null;
  descriptors?: string[];
  interactive?: string[];
};

/** صفحة ESRB الرسمية (www.esrb.org) أو نتيجة بحث PEGI الرسمية (pegi.info). */
export type BoardSnapshot = {
  url: string;
  fetchedAt: string;
  status?: number;
  title?: string;
  platforms?: string | string[];
  rating?: string | null;
  descriptors?: string[];
  interactive?: string[];
  quote?: string | null;
};

export type SnapshotEntry = {
  expect: string;
  esrb?: BoardSnapshot | null;
  pegi?: BoardSnapshot | null;
  appStore: StoreSnapshot | null;
  googlePlay: StoreSnapshot | null;
  playstation?: ConsoleSnapshot | null;
  psExpect?: string;
  xbox?: ConsoleSnapshot | null;
  xboxExpect?: string;
};

export type OfficialDecision = {
  slug: string;
  field: string;
  action: "set" | "replace" | "keep" | "skip";
  detail: string;
};

type Item = { url: string; title: string; quote: string; verifiedAt: string; label: string };

const INTERACTIVE =
  /Users Interact|Purchases|Shares Location|Unrestricted Internet|Digital Purchases/i;

/** أقسام «Age Rating» في App Store: **Frequent** / **Infrequent** / **Contains**. */
export function parseAppleDetails(raw: string | null | undefined): {
  content: string[];
  contains: string[];
} {
  const content: string[] = [];
  const contains: string[] = [];
  let section: string | null = null;
  for (const line of (raw ?? "").split("\n").map((l) => l.trim())) {
    const h = line.match(/^\*\*(.+)\*\*$/);
    if (h) {
      section = h[1]!;
      continue;
    }
    if (!line || !section) continue;
    if (section === "Contains") contains.push(line);
    else content.push(`${section}: ${line}`);
  }
  return { content, contains };
}

function okConsole(s: ConsoleSnapshot | null | undefined, expect: string): s is ConsoleSnapshot {
  return (
    !!s &&
    s.status === 200 &&
    !!s.pageTitle &&
    s.pageTitle.toLowerCase().includes(expect.toLowerCase())
  );
}

function ok(s: StoreSnapshot | null, expect: string): s is StoreSnapshot {
  return (
    !!s &&
    s.status === 200 &&
    !!s.pageTitle &&
    s.pageTitle.toLowerCase().includes(expect.toLowerCase())
  );
}

/** ملخص عربي فقط؛ النصوص الإنجليزية الحرفية تظهر كاقتباس تحت كل مصدر. */
function summarize(lead: string, items: Item[]): string {
  const names = [...new Set(items.map((i) => i.label))];
  return `${lead} ${names.join("، ")}.`;
}

const LEADS: Record<Exclude<PointKey, "sessionPause">, string> = {
  strangerChat: "فيه تواصل مع مستخدمين آخرين، حسب:",
  purchases: "فيه مشتريات داخل اللعبة أو التطبيق، حسب:",
  content: "فيه واصفات محتوى رسمية، حسب:",
  ads: "فيه إعلانات، حسب:",
};

export function applyOfficial(
  current: Title,
  e: SnapshotEntry,
): { title: Title; decisions: OfficialDecision[] } {
  const slug = current.slug;
  const t: Title = structuredClone(current);
  const decisions: OfficialDecision[] = [];
  const log = (field: string, action: OfficialDecision["action"], detail: string) =>
    decisions.push({ slug, field, action, detail });
  const as = ok(e.appStore, e.expect) ? e.appStore : null;
  const gp = ok(e.googlePlay, e.expect) ? e.googlePlay : null;
  if (e.appStore && !as) log("appStore", "skip", `الصفحة ما انجلبت أو ما تطابق «${e.expect}»`);
  if (e.googlePlay && !gp) log("googlePlay", "skip", `الصفحة ما انجلبت أو ما تطابق «${e.expect}»`);

  const setRating = (key: RatingKey, next: Title["ratings"][RatingKey]) => {
    const cur = t.ratings[key];
    if (cur.confidence === "human")
      return log(`ratings.${key}`, "keep", "راجعها إنسان؛ ما نكتب فوقها");
    const action = cur.value === null ? "set" : cur.value === next.value ? "keep" : "replace";
    const detail =
      action === "replace"
        ? `${cur.value} ⇐ ${next.value} (القيمة الرسمية الحالية)`
        : `${next.value}`;
    t.ratings[key] = next;
    log(`ratings.${key}`, action, `${detail} ← ${next.sourceUrl}`);
  };

  const asName = as ? `App Store (السعودية): ${e.expect}` : "";
  const gpName = gp ? `Google Play (السعودية): ${e.expect}` : "";

  if (as?.ageRating) {
    setRating("appStore", {
      value: as.ageRating,
      sourceUrl: as.url,
      verifiedAt: as.fetchedAt,
      quote: `Age Rating ${as.ageRating}`,
      confidence: "auto",
    });
  }

  const gpLines = gp?.ratingLines ?? [];
  const gpDescriptors = gpLines.filter((l) => !INTERACTIVE.test(l));
  const gpInteractive = gpLines
    .filter((l) => INTERACTIVE.test(l))
    .flatMap((l) => l.split(",").map((x) => x.trim()));

  if (gp?.ratedFor && gp.ratingBody === "IARC") {
    const value = gp.ratedFor.replace(/^Rated for\s+/i, "").trim();
    setRating("googlePlay", {
      value,
      ...(gpDescriptors.length ? { descriptors: gpDescriptors } : {}),
      sourceUrl: gp.url,
      verifiedAt: gp.fetchedAt,
      quote: gp.ratedFor,
      confidence: "auto",
    });
  }
  if (gp?.ratedFor && gp.ratingBody === "Gmedia") {
    const badge = gp.badgeSrc?.split("/").pop() ?? "Gmedia";
    setRating("gcam", {
      value: gp.ratedFor,
      ...(gpDescriptors.length ? { descriptors: gpDescriptors } : {}),
      sourceUrl: gp.url,
      verifiedAt: gp.fetchedAt,
      quote: `${badge} — ${gp.ratedFor}`,
      shownOn: "Google Play (السعودية)",
      confidence: "auto",
    });
    log(
      "ratings.googlePlay",
      "skip",
      "Google Play في السعودية يعرض تصنيف Gmedia بدل IARC؛ سُجّل في خانة التصنيف السعودي",
    );
  }

  // الأجهزة المنزلية: PlayStation (السعودية) وXbox (السعودية).
  const psExpect = e.psExpect ?? e.expect;
  const xbExpect = e.xboxExpect ?? e.expect;
  const ps = okConsole(e.playstation, psExpect) ? e.playstation : null;
  const xb = okConsole(e.xbox, xbExpect) ? e.xbox : null;
  if (e.playstation && !ps)
    log("playstation", "skip", `الصفحة ما انجلبت أو ما تطابق «${psExpect}»`);
  if (e.xbox && !xb) log("xbox", "skip", `الصفحة ما انجلبت أو ما تطابق «${xbExpect}»`);
  const psEdition =
    ps && psExpect !== e.expect ? (ps.pageTitle ?? "").split(" - ")[0]!.trim() : undefined;
  const xbEdition = xb && xbExpect !== e.expect ? (xb.pageTitle ?? undefined) : undefined;
  const num = (name: string | null | undefined) => name?.match(/(\d+)$/)?.[1] ?? null;

  const psGcam = ps && ps.authority === "GCAM" ? num(ps.ratingName) : null;
  const xbGamr = xb && xb.boardName === "GAMR" ? xb.rating : null;
  if (psGcam && ps) {
    setRating("gcam", {
      value: psGcam,
      ...(ps.descriptors?.length ? { descriptors: ps.descriptors } : {}),
      sourceUrl: ps.url,
      verifiedAt: ps.fetchedAt,
      quote: ps.ratingDescription ?? `GCAM ${psGcam}`,
      shownOn: "PlayStation (السعودية)",
      ...(psEdition ? { edition: psEdition } : {}),
      confidence: "auto",
    });
  } else if (xbGamr && xb) {
    setRating("gcam", {
      value: xbGamr,
      sourceUrl: xb.url,
      verifiedAt: xb.fetchedAt,
      quote: `GAMR ${xbGamr} — ${xb.ratingDescription ?? ""}`.trim(),
      shownOn: "Xbox (السعودية)",
      ...(xbEdition ? { edition: xbEdition } : {}),
      confidence: "auto",
    });
  }
  if (psGcam && xbGamr && psGcam !== xbGamr) {
    log(
      "ratings.gcam",
      "skip",
      `PlayStation ${psGcam} ≠ Xbox ${xbGamr} (نسخ مختلفة؛ أخذنا PlayStation)`,
    );
  }

  if (xb && xb.boardName === "PEGI" && xb.rating) {
    const value = xb.rating.replace(/^PEGI\s+/, "").trim();
    const desc =
      xb.ratingDescription && xb.ratingDescription !== xb.rating
        ? ` — ${xb.ratingDescription}`
        : "";
    setRating("pegi", {
      value,
      ...(xb.descriptors?.length ? { descriptors: xb.descriptors } : {}),
      sourceUrl: xb.url,
      verifiedAt: xb.fetchedAt,
      quote: `${xb.rating}${desc}`,
      shownOn: "Xbox (السعودية)",
      ...(xbEdition ? { edition: xbEdition } : {}),
      confidence: "auto",
    });
  } else if (ps && ps.authority === "PEGI" && num(ps.ratingName)) {
    setRating("pegi", {
      value: num(ps.ratingName)!,
      ...(ps.descriptors?.length ? { descriptors: ps.descriptors } : {}),
      sourceUrl: ps.url,
      verifiedAt: ps.fetchedAt,
      quote: ps.ratingDescription ?? `PEGI ${num(ps.ratingName)}`,
      shownOn: "PlayStation (السعودية)",
      ...(psEdition ? { edition: psEdition } : {}),
      confidence: "auto",
    });
  }
  if (ps && ps.authority === "Generic") {
    log(
      "ratings",
      "skip",
      `PlayStation يعرض تصنيف IARC عام («${ps.ratingDescription}») — ما له خانة من الجهات الخمس`,
    );
  }

  // جهات التصنيف نفسها: ESRB (www.esrb.org) وPEGI (pegi.info) — مقدّمة على ما تعرضه المتاجر.
  const esrb = e.esrb?.status === 200 && e.esrb.rating ? e.esrb : null;
  const pegi = e.pegi?.status === 200 && e.pegi.rating ? e.pegi : null;
  const esrbDescriptors = (esrb?.descriptors ?? []).filter((d) => d !== "No Descriptors");
  if (esrb) {
    const platforms = Array.isArray(esrb.platforms) ? esrb.platforms.join(", ") : esrb.platforms;
    setRating("esrb", {
      value: esrb.rating!,
      ...(esrbDescriptors.length ? { descriptors: esrbDescriptors } : {}),
      sourceUrl: esrb.url,
      verifiedAt: esrb.fetchedAt,
      quote: esrb.quote ?? `${esrb.title}: ${esrb.rating}`,
      edition: [esrb.title, platforms].filter(Boolean).join(" — "),
      confidence: "auto",
    });
  }
  if (pegi) {
    const pegiDescriptors = (pegi.descriptors ?? []).filter((d) => !/purchases/i.test(d));
    const platforms = Array.isArray(pegi.platforms)
      ? pegi.platforms
          .map((p) => p.replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}$/, ""))
          .filter((p) => !(pegi.title ?? "").includes(p))
          .join(", ")
      : pegi.platforms;
    setRating("pegi", {
      value: pegi.rating!,
      ...(pegiDescriptors.length ? { descriptors: pegiDescriptors } : {}),
      sourceUrl: pegi.url,
      verifiedAt: pegi.fetchedAt,
      quote: pegi.quote ?? `PEGI ${pegi.rating}`,
      edition: [pegi.title, platforms].filter(Boolean).join(" — "),
      confidence: "auto",
    });
  }

  const apple = parseAppleDetails(as?.ageRatingDetails);
  const items: Record<Exclude<PointKey, "sessionPause">, Item[]> = {
    strangerChat: [],
    purchases: [],
    content: [],
    ads: [],
  };
  const fromAS = (label: string, quote: string): Item => ({
    url: as!.url,
    title: asName,
    quote,
    verifiedAt: as!.fetchedAt,
    label,
  });
  const fromGP = (label: string, quote: string): Item => ({
    url: gp!.url,
    title: gpName,
    quote,
    verifiedAt: gp!.fetchedAt,
    label,
  });

  if (as) {
    if (apple.contains.includes("Messaging and Chat"))
      items.strangerChat.push(fromAS("App Store", "Messaging and Chat"));
    if (as.inAppPurchases === "Yes")
      items.purchases.push(fromAS("App Store", "In-App Purchases: Yes"));
    if (apple.contains.includes("Loot Boxes"))
      items.purchases.push(fromAS("App Store", "Loot Boxes"));
    if (apple.contains.includes("Advertising")) items.ads.push(fromAS("App Store", "Advertising"));
    if (apple.content.length) items.content.push(fromAS("App Store", apple.content.join(", ")));
  }
  const fromConsole = (
    src: ConsoleSnapshot,
    label: string,
    expect: string,
    quote: string,
  ): Item => ({
    url: src.url,
    title: `${label} (السعودية): ${expect}`,
    quote,
    verifiedAt: src.fetchedAt,
    label,
  });
  if (ps) {
    const ia = ps.interactive ?? [];
    if (ia.includes("Users Interact"))
      items.strangerChat.push(fromConsole(ps, "PlayStation", psExpect, "Users Interact"));
    const p = ia.find((x) => /Purchases/i.test(x));
    if (p) items.purchases.push(fromConsole(ps, "PlayStation", psExpect, p));
    if (ps.descriptors?.length)
      items.content.push(fromConsole(ps, "PlayStation", psExpect, ps.descriptors.join(", ")));
  }
  if (xb) {
    const ia = xb.interactive ?? [];
    if (ia.includes("تفاعل المستخدمين"))
      items.strangerChat.push(fromConsole(xb, "Xbox", xbExpect, "تفاعل المستخدمين"));
    const p = ia.find((x) => /شراء/.test(x));
    if (p) items.purchases.push(fromConsole(xb, "Xbox", xbExpect, p));
    if (xb.descriptors?.length)
      items.content.push(fromConsole(xb, "Xbox", xbExpect, xb.descriptors.join("، ")));
  }
  const fromBoard = (src: BoardSnapshot, label: string, quote: string): Item => ({
    url: src.url,
    title: `${label}: ${src.title ?? e.expect}`,
    quote,
    verifiedAt: src.fetchedAt,
    label,
  });
  if (esrb) {
    const ia = esrb.interactive ?? [];
    if (ia.includes("Users Interact"))
      items.strangerChat.push(fromBoard(esrb, "ESRB", "Users Interact"));
    const p = ia.find((x) => /Purchases/i.test(x));
    if (p) items.purchases.push(fromBoard(esrb, "ESRB", p));
    if (esrbDescriptors.length)
      items.content.push(fromBoard(esrb, "ESRB", esrbDescriptors.join(", ")));
  }
  if (pegi) {
    const p = (pegi.descriptors ?? []).find((x) => /purchases/i.test(x));
    if (p) items.purchases.push(fromBoard(pegi, "PEGI", p));
    const d = (pegi.descriptors ?? []).filter((x) => !/purchases/i.test(x));
    if (d.length) items.content.push(fromBoard(pegi, "PEGI", d.join(", ")));
  }
  if (gp) {
    if (gpInteractive.includes("Users Interact"))
      items.strangerChat.push(fromGP("Google Play", "Users Interact"));
    const p = gpInteractive.find((x) => /Purchases/i.test(x));
    if (p) items.purchases.push(fromGP("Google Play", p));
    if (gp.containsAds) items.ads.push(fromGP("Google Play", "Contains ads"));
    if (gpDescriptors.length) items.content.push(fromGP("Google Play", gpDescriptors.join(", ")));
  }

  for (const key of Object.keys(items) as Array<keyof typeof items>) {
    const its = items[key];
    if (!its.length) continue;
    const point = t.attentionPoints[key];
    if (point.confidence === "human") {
      log(`attentionPoints.${key}`, "keep", "راجعها إنسان");
      continue;
    }
    // نضيف مصادر المتاجر لأي مصادر سابقة (مثل ESRB من ملف البحث) بدون تكرار.
    const prior = point.sources.filter((s) => !its.some((i) => i.url === s.url));
    const priorItems: Item[] = prior.map((s) => ({
      ...s,
      label: s.title.split(":")[0] ?? s.title,
    }));
    const all = [...priorItems, ...its];
    Object.assign(point, {
      status: "present",
      summaryAr: summarize(LEADS[key], all),
      sources: all.map(({ url, title, quote, verifiedAt }) => ({ url, title, quote, verifiedAt })),
      confidence: "auto",
    });
    log(
      `attentionPoints.${key}`,
      prior.length ? "replace" : "set",
      all.map((i) => `${i.label}: ${i.quote}`).join(" | "),
    );
  }

  // «القمار أو ما يشبهه»: صناديق الحظ والعناصر العشوائية كما يسميها المتجر نفسه.
  const lens: Item[] = [];
  if (as && apple.contains.includes("Loot Boxes")) lens.push(fromAS("App Store", "Loot Boxes"));
  if (as && apple.content.some((c) => /Gambling/i.test(c))) {
    lens.push(fromAS("App Store", apple.content.filter((c) => /Gambling/i.test(c)).join(", ")));
  }
  const randomItems = gpInteractive.find((x) => /Includes Random Items/i.test(x));
  if (gp && randomItems) lens.push(fromGP("Google Play", randomItems));
  const psRandom = ps?.interactive?.find((x) => /Includes Random Items/i.test(x));
  if (ps && psRandom) lens.push(fromConsole(ps, "PlayStation", psExpect, psRandom));
  const xbRandom = xb?.interactive?.find((x) => /عناصر عشوائية/.test(x));
  if (xb && xbRandom) lens.push(fromConsole(xb, "Xbox", xbExpect, xbRandom));
  const esrbRandom = esrb?.interactive?.find((x) => /Random Items|Simulated Gambling/i.test(x));
  if (esrb && esrbRandom) lens.push(fromBoard(esrb, "ESRB", esrbRandom));
  const esrbGambling = esrbDescriptors.find((x) => /Gambling/i.test(x));
  if (esrb && esrbGambling) lens.push(fromBoard(esrb, "ESRB", esrbGambling));
  if (pegi?.quote && /loot box/i.test(pegi.quote)) lens.push(fromBoard(pegi, "PEGI", pegi.quote));
  const pegiGambling = pegi?.descriptors?.find((x) => /Gambling/i.test(x));
  if (pegi && pegiGambling) lens.push(fromBoard(pegi, "PEGI", pegiGambling));
  if (lens.length) {
    const prev = t.familyLens.gambling.sources.filter(
      (s) => !lens.some((i) => i.url === s.url && i.quote === s.quote),
    );
    t.familyLens.gambling = {
      status: "present",
      noteAr: "المتجر يذكر مشتريات بعناصر عشوائية (صناديق حظ).",
      sources: [
        ...prev,
        ...lens.map(({ url, title, quote, verifiedAt }) => ({ url, title, quote, verifiedAt })),
      ],
    };
    log(
      "familyLens.gambling",
      prev.length ? "replace" : "set",
      lens.map((i) => `${i.label}: ${i.quote}`).join(" | "),
    );
  }

  if (!t.publisher && as?.provider) {
    t.publisher = { name: as.provider, url: null };
    log("publisher", "set", `${as.provider} (مزوّد التطبيق في App Store)`);
  }

  if (
    decisions.some((d) => d.action === "set" || d.action === "replace") &&
    t.reviewStatus === "not_found"
  ) {
    t.reviewStatus = "auto_sourced";
  }
  return { title: t, decisions };
}
