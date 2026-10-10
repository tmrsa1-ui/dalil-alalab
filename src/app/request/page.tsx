import type { Metadata } from "next";
import Link from "next/link";
import { ar } from "@/lib/i18n/ar";
import { getIndex, getPlatforms } from "@/lib/data/load";
import { createSearcher } from "@/lib/search";
import { parseAge } from "@/lib/age";
import { isAiCardsEnabled } from "@/lib/ai-flag";
import { RequestTitle } from "@/components/RequestTitle";
import { SourceLink } from "@/components/SourceLink";

export const metadata: Metadata = { title: ar.request.title, robots: { index: false } };

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; age?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const age = parseAge(sp.age);
  const suggestions = q ? createSearcher(getIndex())(q, 3) : [];
  const platforms = getPlatforms();

  return (
    <div className="grid gap-6" data-testid="request-page">
      <header>
        <h1 className="text-3xl font-extrabold">{ar.request.title}</h1>
        <p className="mt-2 text-lg text-muted">{q ? ar.request.lead(q) : ar.request.leadEmpty}</p>
      </header>

      {suggestions.length ? (
        <section aria-labelledby="dym-h">
          <h2 id="dym-h" className="font-bold">
            {ar.request.didYouMean}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s.entry.slug}>
                <Link
                  className="btn btn-secondary"
                  href={`/title/${s.entry.slug}${age ? `?age=${age}` : ""}`}
                >
                  {s.entry.nameAr}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RequestTitle query={q} aiEnabled={isAiCardsEnabled()} age={age} />

      <section aria-labelledby="mean-h" className="card p-4">
        <h2 id="mean-h" className="text-xl font-bold">
          {ar.request.meanwhile}
        </h2>
        <p className="text-sm text-muted">{ar.request.meanwhileLead}</p>
        <ul className="mt-2 grid gap-1">
          {platforms.map((p) => (
            <li key={p.id}>
              {p.officialGuideUrl ? (
                <SourceLink url={p.officialGuideUrl} label={`${ar.setup.platforms[p.id]} — ${p.toolNameEn}`} />
              ) : (
                <span>
                  {ar.setup.platforms[p.id]}: {ar.setup.guideUnavailable}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Link href="/" className="btn btn-ghost">
        {ar.request.searchAgain}
      </Link>
    </div>
  );
}
