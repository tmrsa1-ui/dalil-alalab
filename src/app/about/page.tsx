import type { Metadata } from "next";
import Link from "next/link";
import { pages } from "@/lib/i18n/pages";
import { ar } from "@/lib/i18n/ar";
import { ContentSections } from "@/components/ContentSections";

export const metadata: Metadata = { title: pages.about.title };

export default function AboutPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold">{pages.about.title}</h1>
      <p className="mt-2 text-lg text-muted">{ar.app.description}</p>
      <ContentSections sections={pages.about.sections} />
      <p className="mt-6 flex flex-wrap gap-2">
        <Link href="/sources" className="btn btn-secondary">{ar.nav.sources}</Link>
        <Link href="/privacy" className="btn btn-secondary">{ar.nav.privacy}</Link>
        <Link href="/about/impact" className="btn btn-secondary">{ar.nav.impact}</Link>
      </p>
      <p className="mt-6 text-sm text-muted">{ar.footer.award}</p>
    </article>
  );
}
