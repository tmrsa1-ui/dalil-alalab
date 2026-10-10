import type { Metadata } from "next";
import { ar } from "@/lib/i18n/ar";
import { CharterList } from "@/components/CharterList";

export const metadata: Metadata = { title: ar.charter.title };

export default function CharterPage() {
  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-3xl font-extrabold">{ar.charter.title}</h1>
        <p className="mt-1 text-muted">{ar.charter.lead}</p>
      </header>
      <CharterList />
    </div>
  );
}
