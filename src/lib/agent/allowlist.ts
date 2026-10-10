/**
 * النطاقات الرسمية المسموح الاستشهاد بها أو جلب صفحاتها.
 * لا محركات بحث عامة ولا منتديات ولا ويكي.
 */
export const RATING_AUTHORITIES = {
  gcam: ["gcam.gov.sa"],
  esrb: ["esrb.org"],
  pegi: ["pegi.info"],
  appStore: ["apps.apple.com", "itunes.apple.com"],
  googlePlay: ["play.google.com"],
} as const;

export type RatingAuthority = keyof typeof RATING_AUTHORITIES;

/** أدلة المنصات الرسمية (للرقابة الأبوية). */
export const PLATFORM_DOMAINS = [
  "support.apple.com",
  "apple.com",
  "families.google",
  "support.google.com",
  "playstation.com",
  "xbox.com",
  "support.xbox.com",
  "microsoft.com",
  "support.microsoft.com",
  "nintendo.com",
  "en-americas-support.nintendo.com",
  "steampowered.com",
  "store.steampowered.com",
  "help.steampowered.com",
] as const;

/** النطاقات الرسمية لناشري العناوين في الدليل (صفحات دعم ورقابة أبوية). */
export const PUBLISHER_DOMAINS = [
  "roblox.com",
  "minecraft.net",
  "epicgames.com",
  "innersloth.com",
  "supercell.com",
  "tiktok.com",
  "snap.com",
  "snapchat.com",
  "youtube.com",
  "nianticlabs.com",
  "pokemongolive.com",
  "ea.com",
  "callofduty.com",
  "activision.com",
  "pubgmobile.com",
  "garena.com",
  "ff.garena.com",
  "sybogames.com",
  "hoyoverse.com",
  "scopely.com",
  "discord.com",
  "instagram.com",
  "about.instagram.com",
  "meta.com",
  "rocketleague.com",
] as const;

export const ALLOWLIST: readonly string[] = [
  ...Object.values(RATING_AUTHORITIES).flat(),
  ...PLATFORM_DOMAINS,
  ...PUBLISHER_DOMAINS,
];

export function hostOf(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** هل النطاق يساوي أحد النطاقات أو نطاق فرعي منه؟ */
export function hostMatches(host: string, domains: readonly string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

export function isAllowedUrl(url: string, publisherUrl?: string | null): boolean {
  const host = hostOf(url);
  if (!host) return false;
  if (hostMatches(host, ALLOWLIST)) return true;
  if (publisherUrl) {
    const pub = hostOf(publisherUrl);
    if (pub && hostMatches(host, [pub])) return true;
  }
  return false;
}

export function isRatingAuthorityUrl(url: string, authority: RatingAuthority): boolean {
  const host = hostOf(url);
  return !!host && hostMatches(host, RATING_AUTHORITIES[authority]);
}

export function isDemoUrl(url: string): boolean {
  return hostOf(url) === "example.org";
}
