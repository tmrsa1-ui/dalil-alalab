import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ar } from "@/lib/i18n/ar";
import { getAgreement, getIndex, getPlatforms, getQuestions, getTitle } from "@/lib/data/load";
import { TitleJourney } from "@/components/TitleJourney";
import { DemoBadge } from "@/components/DemoBadge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";

export const dynamicParams = false;

export function generateStaticParams() {
  return getIndex().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTitle(slug);
  return t ? { title: `${t.nameAr} (${t.nameEn})` } : {};
}

export default async function TitlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = getTitle(slug);
  if (!title) notFound();
  const statusLevel =
    title.reviewStatus === "human_reviewed"
      ? "human"
      : title.reviewStatus === "auto_sourced"
        ? "auto"
        : "none";

  return (
    <article>
      <header className="mb-4">
        <p className="text-sm font-semibold text-muted">
          {title.kind === "app" ? ar.title.kindApp : ar.title.kindGame}
        </p>
        <h1 className="text-3xl font-extrabold">
          {title.nameAr}{" "}
          <span className="text-lg font-semibold text-muted" dir="ltr" lang="en">
            {title.nameEn}
          </span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {title.isDemo ? <DemoBadge /> : null}
          <ConfidenceBadge level={statusLevel} isDemo={title.isDemo} />
          {title.lastReviewedAt ? (
            <span className="num text-sm text-muted">
              {ar.title.lastReviewed(title.lastReviewedAt)}
            </span>
          ) : null}
        </div>
        {title.isDemo ? (
          <p
            className="mt-3 rounded-xl border border-demo/40 bg-demo-soft p-3 text-sm text-demo"
            data-testid="demo-notice"
          >
            {ar.title.demoNotice}
          </p>
        ) : null}
      </header>
      <TitleJourney
        title={title}
        platforms={getPlatforms()}
        questions={getQuestions()}
        agreement={getAgreement()}
      />
    </article>
  );
}
