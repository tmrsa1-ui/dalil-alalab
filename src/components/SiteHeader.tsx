import Link from "next/link";
import { ar } from "@/lib/i18n/ar";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-line bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2 text-lg font-extrabold text-ink no-underline"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-ink"
          >
            د
          </span>
          {ar.app.name}
        </Link>
        <nav aria-label={ar.nav.menu} className="flex items-center gap-1">
          <Link href="/charter" className="btn btn-ghost px-3 text-sm">
            {ar.nav.charter}
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
