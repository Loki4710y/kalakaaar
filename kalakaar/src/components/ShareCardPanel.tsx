"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Download, Share2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { shareCardPath, type CardKind, type CardSize } from "../lib/shareCard";

interface Props {
  kind: CardKind;
  id: string;
  /** Used as the file name and share title. */
  title: string;
  /** The page the card points to. Added to the shared message. */
  pageUrl: string;
  /** Changes when the picture on the card changes (e.g. the artist's new photo), so an old cached card is not shown. */
  version?: string;
}

/**
 * The branded Kalakaar card for an artwork or an artist: a preview, download buttons for the two
 * social sizes, and a Share button that sends the picture itself (so it can go straight to a WhatsApp status).
 */
export function ShareCardPanel({ kind, id, title, pageUrl, version }: Props) {
  const { t, lang } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const cardUrl = (size: CardSize, download = false) => {
    const base = shareCardPath(kind, id, size, lang, version);
    return base + (download ? `${base.includes("?") ? "&" : "?"}download=1` : "");
  };

  const shareImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(cardUrl("story"));
      if (!res.ok) throw new Error("card");
      const blob = await res.blob();
      const file = new File([blob], `kalakaar-${kind}.jpg`, { type: blob.type || "image/jpeg" });
      const text = t("share.whatsappText", { name: title }) + "\n" + pageUrl;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
      } else if (navigator.share) {
        await navigator.share({ title, text, url: pageUrl });
      } else {
        await navigator.clipboard.writeText(pageUrl);
        toast.success(t("share.copied"));
      }
    } catch (err) {
      // Closing the share sheet is not an error.
      if ((err as { name?: string })?.name !== "AbortError") toast.error(t("share.cardFailed"));
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "inline-flex items-center gap-2 px-4 py-2 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] focus-visible:ring-offset-2";

  return (
    <section className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-5" aria-labelledby={`share-card-${kind}-${id}`}>
      <h3 id={`share-card-${kind}-${id}`} className="font-serif text-[1.15rem] text-[#2C1810] mb-1">{t("share.card")}</h3>
      <p className="font-sans text-[0.8rem] text-[#7A5C4E] mb-4">{t("share.cardHint")}</p>

      {!previewFailed && (
        <div className="relative w-full max-w-md aspect-[1200/630] bg-[#F5EFE0] border border-[rgba(107,30,46,0.15)] mb-4">
          <Image
            key={`${kind}-${id}-${lang}-${version || ""}`}
            src={cardUrl("og")}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            unoptimized
            className="object-cover"
            onError={() => setPreviewFailed(true)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a href={cardUrl("story", true)} download className={btn}>
          <Download size={14} aria-hidden="true" /> {t("share.downloadStory")}
        </a>
        <a href={cardUrl("post", true)} download className={btn}>
          <Download size={14} aria-hidden="true" /> {t("share.downloadPost")}
        </a>
        <button type="button" onClick={shareImage} disabled={busy} className={`${btn} disabled:opacity-60`}>
          <Share2 size={14} aria-hidden="true" /> {busy ? t("share.opening") : t("share.share")}
        </button>
      </div>
    </section>
  );
}
