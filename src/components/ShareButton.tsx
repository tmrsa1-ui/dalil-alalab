"use client";
import { useState } from "react";
import { ar } from "@/lib/i18n/ar";

/**
 * يشارك رابط بطاقة العنوان (مثلًا مع الأم أو الأب) — **بدون عمر الطفل**، وبدون أي طلب لخادمنا.
 * يستخدم مشاركة الجوال إن وُجدت، وإلا ينسخ الرابط.
 */
export function ShareButton({ slug, name }: { slug: string; name: string }) {
  const [status, setStatus] = useState("");
  async function share() {
    const url = `${window.location.origin}/title/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${ar.app.name}: ${name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus(ar.title.linkCopied);
    } catch {
      /* المستخدم ألغى المشاركة */
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="btn btn-secondary text-sm"
        onClick={share}
        data-testid="share"
      >
        {ar.title.shareTitle}
      </button>
      <span role="status" className="text-sm text-ok">
        {status}
      </span>
    </span>
  );
}
