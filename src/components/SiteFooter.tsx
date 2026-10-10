import Link from "next/link";
import { ar } from "@/lib/i18n/ar";

export function SiteFooter() {
  const links = [
    ["/about", ar.nav.about],
    ["/sources", ar.nav.sources],
    ["/privacy", ar.nav.privacy],
    ["/about/impact", ar.nav.impact],
    ["/charter", ar.nav.charter],
  ] as const;
  return (
    <footer className="no-print mt-12 border-t border-line bg-surface pb-8">
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm">
        <nav aria-label={ar.nav.about}>
          <ul className="flex flex-wrap gap-x-1 gap-y-1">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="btn btn-ghost min-h-[44px] px-2 text-sm">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-3 text-muted">{ar.footer.notBlocking}</p>
        <p className="mt-1 text-muted">{ar.footer.award}</p>
      </div>
    </footer>
  );
}
