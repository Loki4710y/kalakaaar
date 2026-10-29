"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle, X, ListChecks } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import type { DictKey } from "../../lib/i18n";
import type { OnboardingStep } from "../../lib/onboarding";

const flagKey = (kind: "shared" | "hidden", userId: string) => `kalakaar_onboarding_${kind}_${userId}`;

function readFlag(kind: "shared" | "hidden", userId: string): boolean {
  try {
    return window.localStorage.getItem(flagKey(kind, userId)) === "1";
  } catch {
    return false;
  }
}

function writeFlag(kind: "shared" | "hidden", userId: string, on: boolean) {
  try {
    if (on) window.localStorage.setItem(flagKey(kind, userId), "1");
    else window.localStorage.removeItem(flagKey(kind, userId));
  } catch {
    /* storage blocked: the flag only lasts for this visit */
  }
}

/**
 * "Shared my link" and "hidden the checklist" live in this browser only (nothing is sent anywhere).
 * Every other step is read from the real profile.
 */
export function useOnboardingFlags(userId: string | undefined) {
  const [shared, setShared] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setShared(readFlag("shared", userId));
    setHidden(readFlag("hidden", userId));
  }, [userId]);

  const markShared = useCallback(() => {
    if (!userId) return;
    setShared(true);
    writeFlag("shared", userId, true);
  }, [userId]);

  const setHiddenFlag = useCallback(
    (on: boolean) => {
      if (!userId) return;
      setHidden(on);
      writeFlag("hidden", userId, on);
    },
    [userId]
  );

  return { shared, hidden, markShared, setHidden: setHiddenFlag };
}

interface Props {
  steps: OnboardingStep[];
  done: number;
  total: number;
  complete: boolean;
  hidden: boolean;
  onHide: () => void;
  onShow: () => void;
  /** Copies the artist's public profile link; the portal then marks the share step done. */
  onShare: () => Promise<boolean>;
}

export function OnboardingChecklist({ steps, done, total, complete, hidden, onHide, onShow, onShare }: Props) {
  const { t } = useLanguage();

  if (hidden) {
    // A completed checklist stays out of the way for good; an unfinished one can be reopened.
    if (complete) return null;
    return (
      <div className="mb-10">
        <button
          type="button"
          onClick={onShow}
          className="inline-flex items-center gap-2 font-sans text-[0.8rem] text-[#6B1E2E] hover:underline cursor-pointer"
        >
          <ListChecks size={15} aria-hidden="true" /> {t("onboarding.show")} ({t("onboarding.progress", { done, total })})
        </button>
      </div>
    );
  }

  const handleShare = async () => {
    const ok = await onShare();
    if (ok) toast.success(t("onboarding.copied"));
  };

  const pct = Math.round((done / total) * 100);

  return (
    <section className="mb-12 bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 relative" aria-labelledby="onboarding-title">
      <button
        type="button"
        onClick={onHide}
        aria-label={t("onboarding.dismiss")}
        title={t("onboarding.dismiss")}
        className="absolute top-3 right-3 p-1.5 text-[#9C7A6A] hover:text-[#6B1E2E] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E]"
      >
        <X size={16} />
      </button>

      <h2 id="onboarding-title" className="font-serif text-[1.5rem] text-[#2C1810] mb-1 pr-8">{t("onboarding.title")}</h2>
      <p className="font-sans text-[0.85rem] text-[#7A5C4E] mb-4">{complete ? t("onboarding.allDone") : t("onboarding.subtitle")}</p>

      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex-1 h-2 bg-[#EDE4CE]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={t("onboarding.progress", { done, total })}
        >
          <div className="h-full bg-[#6B1E2E] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-sans text-[0.78rem] text-[#7A5C4E] whitespace-nowrap">{t("onboarding.progress", { done, total })}</span>
      </div>

      <ul className="divide-y divide-[rgba(107,30,46,0.1)]">
        {steps.map((s) => {
          const label = t(`onboarding.${s.id}` as DictKey);
          const hint = t(`onboarding.${s.id}Hint` as DictKey);
          return (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border ${
                  s.done ? "bg-[#6B1E2E] border-[#6B1E2E] text-[#FFFDF7]" : "border-[rgba(107,30,46,0.35)] text-transparent"
                }`}
                aria-hidden="true"
              >
                {s.done ? <Check size={14} /> : <Circle size={10} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block font-sans text-[0.95rem] ${s.done ? "text-[#9C7A6A] line-through" : "text-[#2C1810] font-medium"}`}>{label}</span>
                {!s.done && <span className="block font-sans text-[0.78rem] text-[#7A5C4E]">{hint}</span>}
              </span>
              {s.done ? (
                <span className="font-sans text-[0.72rem] uppercase tracking-wider text-[#9C7A6A]">{t("onboarding.done")}</span>
              ) : s.href ? (
                <Link
                  href={s.href}
                  className="px-4 py-1.5 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors"
                >
                  {t("onboarding.go")}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-1.5 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors cursor-pointer"
                >
                  {t("onboarding.go")}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {complete && (
        <button type="button" onClick={onHide} className="mt-4 font-sans text-[0.8rem] text-[#6B1E2E] hover:underline cursor-pointer">
          {t("onboarding.dismiss")}
        </button>
      )}
    </section>
  );
}
