import type { Metadata } from "next";
import { pages } from "@/lib/i18n/pages";
import { ar } from "@/lib/i18n/ar";
import { ContentSections } from "@/components/ContentSections";
import { getPlatforms } from "@/lib/data/load";
import { SourceLink } from "@/components/SourceLink";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";

export const metadata: Metadata = { title: pages.sources.title };

export default function SourcesPage() {
  const platforms = getPlatforms();
  return (
    <article>
      <h1 className="text-3xl font-extrabold">{pages.sources.title}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfidenceBadge level="human" />
        <ConfidenceBadge level="auto" />
        <ConfidenceBadge level="none" />
      </div>
      <ContentSections sections={pages.sources.sections} />
      <section className="prose-ar">
        <h2>{ar.setup.officialGuide}</h2>
        <ul>
          {platforms.map((p) => (
            <li key={p.id}>
              <strong>{ar.setup.platforms[p.id]}</strong> (<span dir="ltr">{p.toolNameEn}</span>):{" "}
              {p.officialGuideUrl ? (
                <SourceLink url={p.officialGuideUrl} verifiedAt={p.verifiedAt} />
              ) : (
                ar.setup.guideUnavailable
              )}
              {!p.verifiedAt ? <span className="block text-xs text-muted">{ar.setup.guidePending}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
