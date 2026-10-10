import { ar } from "@/lib/i18n/ar";

export default function Loading() {
  return (
    <p role="status" className="py-8 text-center text-muted">
      {ar.loading}
    </p>
  );
}
