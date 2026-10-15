import type { Metadata } from "next";
import { pages } from "@/lib/i18n/pages";
import { ContentSections } from "@/components/ContentSections";
import { PrivacyControls } from "@/components/PrivacyControls";

export const metadata: Metadata = { title: pages.privacy.title };

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold">{pages.privacy.title}</h1>
      <p className="mt-2">{pages.privacy.intro}</p>
      <ContentSections sections={pages.privacy.sections} />
      <PrivacyControls />
    </article>
  );
}
