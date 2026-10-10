import { applyOfficial, parseAppleDetails, type SnapshotEntry } from "@/lib/data/official-apply";
import { emptyTitle } from "@/lib/data/template";
import { titleSchema } from "@schemas/title";

const AS = "https://apps.apple.com/sa/app/id1";
const GP = "https://play.google.com/store/apps/details?id=x&hl=en&gl=SA";
const entry = (over: Partial<SnapshotEntry> = {}): SnapshotEntry => ({
  expect: "Game",
  appStore: {
    url: AS,
    fetchedAt: "2026-10-10",
    status: 200,
    pageTitle: "Game App - App Store",
    provider: "Studio",
    ageRating: "13+",
    ageRatingDetails:
      "**Frequent**\nGuns or Other Weapons\n\n**Infrequent**\nRealistic Violence\n\n**Contains**\nLoot Boxes\nAdvertising\nMessaging and Chat",
    inAppPurchases: "Yes",
  },
  googlePlay: {
    url: GP,
    fetchedAt: "2026-10-10",
    status: 200,
    pageTitle: "Game",
    ratingBody: "IARC",
    ratedFor: "Rated for 16+",
    ratingLines: ["Moderate Violence", "Users Interact, In-Game Purchases (Includes Random Items)"],
    containsAds: true,
  },
  ...over,
});

describe("applyOfficial (App Store / Google Play)", () => {
  it("parseAppleDetails يفصل أقسام التكرار عن «Contains»", () => {
    expect(parseAppleDetails("**Infrequent**\nA\nB\n\n**Contains**\nMessaging and Chat")).toEqual({
      content: ["Infrequent: A", "Infrequent: B"],
      contains: ["Messaging and Chat"],
    });
  });

  it("يكتب التصنيفات والنقاط باقتباس حرفي ورابط وتاريخ وحالة «بحاجة مراجعة بشرية»", () => {
    const { title } = applyOfficial(emptyTitle("game", "لعبة", "Game"), entry());
    expect(title.ratings.appStore).toMatchObject({
      value: "13+",
      sourceUrl: AS,
      quote: "Age Rating 13+",
      confidence: "auto",
    });
    expect(title.ratings.googlePlay).toMatchObject({
      value: "16+",
      descriptors: ["Moderate Violence"],
      confidence: "auto",
    });
    expect(title.ratings.gcam.value).toBeNull();
    expect(title.attentionPoints.strangerChat.sources.map((s) => s.quote)).toEqual([
      "Messaging and Chat",
      "Users Interact",
    ]);
    expect(title.attentionPoints.ads.status).toBe("present");
    expect(title.attentionPoints.content.sources[0]!.quote).toContain(
      "Frequent: Guns or Other Weapons",
    );
    expect(title.attentionPoints.sessionPause.status).toBe("unknown");
    expect(title.familyLens.gambling.status).toBe("present");
    expect(title.familyLens.music.status).toBe("unknown");
    expect(title.publisher).toEqual({ name: "Studio", url: null });
    expect(title.reviewStatus).toBe("auto_sourced");
    expect(titleSchema.safeParse(title).success).toBe(true);
  });

  it("شارة Gmedia في Google Play السعودي ⇐ خانة التصنيف السعودي، وGoogle Play يبقى غير متوفر", () => {
    const { title } = applyOfficial(
      emptyTitle("game", "لعبة", "Game"),
      entry({
        googlePlay: {
          url: GP,
          fetchedAt: "2026-10-10",
          status: 200,
          pageTitle: "Game",
          ratingBody: "Gmedia",
          badgeSrc: "https://play-apps-features.googleusercontent.com/png/Gmedia_12_272.png",
          ratedFor: "12",
          ratingLines: ["Users Interact"],
        },
      }),
    );
    expect(title.ratings.gcam).toMatchObject({
      value: "12",
      shownOn: "Google Play (السعودية)",
      quote: "Gmedia_12_272.png — 12",
    });
    expect(title.ratings.googlePlay.value).toBeNull();
  });

  it("صفحة ما تطابق اسم العنوان أو فشل جلبها ⇐ ما نكتب منها شي", () => {
    const { title } = applyOfficial(
      emptyTitle("game", "لعبة", "Game"),
      entry({
        appStore: {
          url: AS,
          fetchedAt: "2026-10-10",
          status: 200,
          pageTitle: "Other App",
          ageRating: "4+",
        },
        googlePlay: { url: GP, fetchedAt: "2026-10-10", status: 429 },
      }),
    );
    expect(title.ratings.appStore.value).toBeNull();
    expect(title.ratings.googlePlay.value).toBeNull();
    expect(title.reviewStatus).toBe("not_found");
  });

  it("ما يكتب فوق قيمة راجعها إنسان", () => {
    const t = emptyTitle("game", "لعبة", "Game");
    t.reviewStatus = "human_reviewed";
    t.lastReviewedAt = "2026-10-01";
    t.ratings.appStore = {
      value: "12+",
      sourceUrl: AS,
      verifiedAt: "2026-10-01",
      confidence: "human",
    };
    const { title } = applyOfficial(t, entry());
    expect(title.ratings.appStore.value).toBe("12+");
  });
});
