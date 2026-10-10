"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ar } from "@/lib/i18n/ar";
import { resolveTitle } from "@/lib/search";
import { track } from "@/lib/events";
import { ageBandOf, parseAge } from "@/lib/age";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { TitleIndexEntry } from "@schemas/title";
import { SearchBox } from "./SearchBox";
import { AgePicker } from "./AgePicker";

export function HomeForm({ index }: { index: TitleIndexEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<TitleIndexEntry | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ title?: string; age?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // العمر من الجلسة الحالية فقط (sessionStorage).
    const saved = parseAge(readJSON<string | null>(KEYS.age, null, "session"));
    if (saved) setAge(saved);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!query.trim()) next.title = ar.home.needTitle;
    if (age === null) next.age = ar.home.needAge;
    setErrors(next);
    if (next.title || next.age || age === null) return;
    setBusy(true);
    writeJSON(KEYS.age, String(age), "session");
    const entry = picked && picked.nameAr === query ? picked : resolveTitle(index, query);
    track({ type: "search", found: !!entry, ageBand: ageBandOf(age), titleSlug: entry?.slug });
    if (entry) router.push(`/title/${entry.slug}?age=${age}`);
    else router.push(`/request?q=${encodeURIComponent(query.trim().slice(0, 80))}&age=${age}`);
  }

  return (
    <form onSubmit={submit} noValidate className="card grid gap-5 p-4 shadow-sm sm:p-6" role="search">
      <SearchBox
        index={index}
        value={query}
        onChange={(v) => {
          setQuery(v);
          setPicked(null);
        }}
        onPick={setPicked}
        error={errors.title}
      />
      <AgePicker value={age} onChange={setAge} error={errors.age} />
      <button type="submit" className="btn btn-primary w-full text-lg" disabled={busy}>
        {ar.home.start}
        <span aria-hidden="true">←</span>
      </button>
    </form>
  );
}
