import type { Metadata } from "next";
import { ar } from "@/lib/i18n/ar";
import { AgreementPrint } from "@/components/AgreementPrint";

export const metadata: Metadata = { title: ar.print.title, robots: { index: false } };

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <AgreementPrint id={id ?? null} />;
}
