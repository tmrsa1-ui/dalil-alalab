import type { Title } from "../../../schemas/title";

const nullRating = () => ({ value: null, sourceUrl: null, verifiedAt: null });
const unknownPoint = () => ({ status: "unknown" as const, summaryAr: "", sources: [], confidence: "none" as const });
const unknownLens = () => ({ status: "unknown" as const, noteAr: "", sources: [] });

/** بطاقة فاضية: كل شي «غير متوفر/ما لقيت» لين يعبّيها مراجع بمصادر. */
export function emptyTitle(slug: string, nameAr: string, nameEn: string): Title {
  return {
    $schema: "../../schemas/json/title.schema.json",
    slug,
    nameAr,
    nameEn,
    aliases: [],
    kind: "game",
    platforms: [],
    publisher: null,
    isDemo: false,
    reviewStatus: "not_found",
    lastReviewedAt: null,
    ratings: {
      gcam: nullRating(),
      esrb: nullRating(),
      pegi: nullRating(),
      appStore: nullRating(),
      googlePlay: nullRating(),
    },
    attentionPoints: {
      strangerChat: unknownPoint(),
      purchases: unknownPoint(),
      content: unknownPoint(),
      ads: unknownPoint(),
      sessionPause: { ...unknownPoint(), hasRecommendationFeed: null, autoplay: null },
    },
    familyLens: {
      gambling: unknownLens(),
      mixedVoiceChat: unknownLens(),
      magic: unknownLens(),
      clothing: unknownLens(),
      music: unknownLens(),
    },
    prayerPause: unknownLens(),
    controls: { inGame: [], platformOverrides: {} },
    conversationTags: [],
  };
}
