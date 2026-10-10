import Link from "next/link";
import { ar } from "@/lib/i18n/ar";
import { getIndex } from "@/lib/data/load";
import { HomeForm } from "@/components/HomeForm";
import { STEP_IDS } from "@/lib/steps";

export default function HomePage() {
  const index = getIndex();
  const rank = { human_reviewed: 0, auto_sourced: 1, not_found: 2 } as const;
  const featured = [...index]
    .sort((a, b) => rank[a.reviewStatus] - rank[b.reviewStatus])
    .slice(0, 6);
  const icons = { know: "🔎", setup: "⚙️", talk: "💬", agree: "🤝" } as const;
  return (
    <div className="grid gap-8">
      <section className="pt-2">
        <p className="mb-1 font-bold text-brand">{ar.app.name}</p>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{ar.home.heroTitle}</h1>
        <p className="mt-3 text-lg text-muted">{ar.home.heroLead}</p>
      </section>

      <HomeForm index={index} />

      {featured.length ? (
        <section aria-labelledby="try-h">
          <h2 id="try-h" className="mb-2 text-sm font-bold text-muted">
            {ar.home.tryThese}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {featured.map((t) => (
              <li key={t.slug}>
                <Link href={`/title/${t.slug}`} className="btn btn-secondary min-h-[44px] text-sm">
                  {t.nameAr}
                  {t.isDemo ? (
                    <span className="chip bg-demo-soft text-demo">{ar.demo.badge}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="steps-h">
        <h2 id="steps-h" className="mb-3 text-xl font-bold">
          {ar.home.stepsTitle}
        </h2>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEP_IDS.map((s, i) => (
            <li key={s} className="card p-3">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-2xl">
                  {icons[s]}
                </span>
                <span className="num text-sm font-bold text-muted">{i + 1}</span>
              </div>
              <p className="mt-1 text-lg font-extrabold">{ar.steps[s].label}</p>
              <p className="text-sm text-muted">{ar.steps[s].short}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-brand-soft p-3 text-sm">
          <strong>{ar.app.stance}</strong> {ar.home.noAccount}
        </p>
        <p className="mt-3 text-sm">
          <Link href="/charter">{ar.home.charterCta}</Link>
        </p>
      </section>
    </div>
  );
}
