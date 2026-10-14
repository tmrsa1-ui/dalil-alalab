import type { MetadataRoute } from "next";
import { getIndex } from "@/lib/data/load";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/sources`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly", priority: 0.3 },
  ];
  // العناوين الحقيقية فقط (الفهرس ما فيه بطاقات تجريبية في الإنتاج).
  const titles: MetadataRoute.Sitemap = getIndex()
    .filter((t) => !t.isDemo)
    .map((t) => ({
      url: `${siteUrl}/title/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  return [...pages, ...titles];
}
