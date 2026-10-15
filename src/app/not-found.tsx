import Link from "next/link";
import { ar } from "@/lib/i18n/ar";

export default function NotFound() {
  return (
    <div className="grid gap-4 py-8 text-center">
      <h1 className="text-2xl font-extrabold">{ar.notFound.title}</h1>
      <p className="text-muted">{ar.notFound.lead}</p>
      <Link href="/" className="btn btn-primary mx-auto">
        {ar.notFound.home}
      </Link>
    </div>
  );
}
