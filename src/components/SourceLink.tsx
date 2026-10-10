import { ar } from "@/lib/i18n/ar";

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** كل رابط خارجي يفتح في نافذة جديدة مع rel="noopener noreferrer". */
export function SourceLink({
  url,
  label,
  verifiedAt,
  quote,
  className = "",
}: {
  url: string;
  label?: string;
  verifiedAt?: string | null;
  /** الاقتباس الحرفي من المصدر (يظهر تحت الرابط كدليل). */
  quote?: string;
  className?: string;
}) {
  const isDemo = hostLabel(url) === "example.org";
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center gap-1 font-semibold underline decoration-1"
        data-testid="source-link"
      >
        <span dir="auto">{label ?? hostLabel(url)}</span>
        <span aria-hidden="true">↗</span>
        <span className="sr-only">{ar.source.opensNewTab}</span>
      </a>
      {isDemo ? <span className="text-xs text-demo">({ar.source.demoLink})</span> : null}
      {verifiedAt ? (
        <span className="text-xs text-muted num">{ar.know.verifiedAt(verifiedAt)}</span>
      ) : null}
      {quote && !isDemo ? (
        <span className="w-full text-xs text-muted" data-testid="source-quote">
          {ar.source.quote}: «<bdi dir="ltr">{quote}</bdi>»
        </span>
      ) : null}
    </span>
  );
}
