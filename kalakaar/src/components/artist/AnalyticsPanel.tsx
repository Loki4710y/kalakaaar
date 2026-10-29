"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Eye, Heart, Bookmark, UserPlus, MousePointerClick } from "lucide-react";
import { AnalyticsService, type ArtistAnalytics } from "../../../services/AnalyticsService";
import { barPercent, isAnalyticsEmpty, peakDay } from "../../lib/analytics";
import { useLanguage } from "../../contexts/LanguageContext";
import { EmptyState } from "../ui/EmptyState";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

/** "2026-10-04" -> "4 Oct" / "4 अक्तू". Always formatted in Indian time so the day never shifts. */
function formatDay(day: string, lang: "en" | "hi"): string {
  const d = new Date(`${day}T00:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

interface Props {
  /** Public link of the artist's profile (used by the empty-state button). */
  profileLink: string;
  /** Called after the profile link was copied, so the onboarding checklist can tick "share". */
  onLinkCopied?: () => void;
}

export function AnalyticsPanel({ profileLink, onLinkCopied }: Props) {
  const { t, lang } = useLanguage();
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<ArtistAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (days: Range) => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    const res = await AnalyticsService.getMyAnalytics(days);
    if (id !== requestId.current) return; // a newer request replaced this one
    if (res.success && res.data) setData(res.data);
    else setFailed(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(range);
  }, [range, load]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileLink);
      onLinkCopied?.();
      toast.success(t("onboarding.copied"));
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  const tiles = data
    ? ([
        { key: "views", label: t("analytics.views"), value: data.totals.views, icon: Eye },
        { key: "likes", label: t("analytics.likes"), value: data.totals.likes, icon: Heart },
        { key: "saves", label: t("analytics.saves"), value: data.totals.saves, icon: Bookmark },
        { key: "followers", label: t("analytics.followers"), value: data.totals.followers, icon: UserPlus },
        { key: "taps", label: t("analytics.taps"), value: data.totals.contacts, icon: MousePointerClick },
      ] as const)
    : [];

  const maxViews = data ? Math.max(0, ...data.daily.map((d) => d.views)) : 0;
  const peak = data ? peakDay(data.daily) : null;
  const first = data?.daily[0];
  const mid = data ? data.daily[Math.floor(data.daily.length / 2)] : undefined;
  const last = data?.daily[data.daily.length - 1];

  return (
    <section className="mb-16 bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6" aria-labelledby="analytics-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 id="analytics-title" className="font-serif text-[1.6rem] text-[#2C1810] mb-1">{t("analytics.title")}</h2>
          <p className="font-sans text-[0.85rem] text-[#7A5C4E]">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex border border-[rgba(107,30,46,0.3)] self-start" role="group" aria-label={t("analytics.title")}>
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 font-sans text-[0.75rem] uppercase tracking-wider font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] ${
                range === r ? "bg-[#6B1E2E] text-[#FFFDF7]" : "text-[#6B1E2E] hover:bg-[rgba(107,30,46,0.06)]"
              }`}
            >
              {t(`analytics.range${r}` as "analytics.range7")}
            </button>
          ))}
        </div>
      </div>

      {failed && (
        <div className="text-center py-8" role="alert">
          <p className="font-sans text-[0.95rem] text-[#7A5C4E] mb-4">{t("analytics.loadFailed")}</p>
          <button
            type="button"
            onClick={() => load(range)}
            className="px-6 py-2.5 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-[0.8rem] uppercase tracking-wider font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors cursor-pointer"
          >
            {t("analytics.retry")}
          </button>
        </div>
      )}

      {!failed && loading && !data && (
        <div className="animate-pulse" aria-hidden="true">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-[#F5EFE0]" />)}
          </div>
          <div className="h-40 bg-[#F5EFE0]" />
        </div>
      )}

      {!failed && data && isAnalyticsEmpty(data) && (
        <EmptyState type="no_views" onAction={copyLink} />
      )}

      {!failed && data && !isAnalyticsEmpty(data) && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {tiles.map(({ key, label, value, icon: Icon }) => (
              <div key={key} className="border border-[rgba(107,30,46,0.12)] p-4">
                <span className="font-sans text-[0.7rem] uppercase tracking-widest text-[#9C7A6A] mb-2 flex items-center gap-2">
                  <Icon size={13} aria-hidden="true" /> {label}
                </span>
                <span className="font-serif text-[2rem] text-[#6B1E2E] leading-none">{value.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}</span>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-3 gap-3">
              <h3 className="font-serif text-[1.15rem] text-[#2C1810]">{t("analytics.dailyViews")}</h3>
              {peak && (
                <span className="font-sans text-[0.78rem] text-[#7A5C4E] text-right">
                  {t("analytics.peak", { day: formatDay(peak.day, lang), n: peak.views })}
                </span>
              )}
            </div>
            <div
              role="img"
              aria-label={t("analytics.chartLabel")}
              className="flex items-end gap-[2px] h-40 border-b border-[rgba(107,30,46,0.25)]"
            >
              {data.daily.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 h-full flex items-end"
                  title={`${formatDay(d.day, lang)}: ${d.views}`}
                >
                  <div
                    className="w-full bg-[#6B1E2E] hover:bg-[#8B2A3E] transition-colors"
                    style={{ height: `${barPercent(d.views, maxViews)}%` }}
                  />
                </div>
              ))}
            </div>
            {first && mid && last && (
              <div className="flex justify-between font-sans text-[0.7rem] text-[#9C7A6A] mt-1.5" aria-hidden="true">
                <span>{formatDay(first.day, lang)}</span>
                <span>{formatDay(mid.day, lang)}</span>
                <span>{formatDay(last.day, lang)}</span>
              </div>
            )}
            <p className="font-sans text-[0.72rem] text-[#9C7A6A] mt-3">{t("analytics.note")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-serif text-[1.15rem] text-[#2C1810] mb-3">{t("analytics.top")}</h3>
              {data.top.length === 0 ? (
                <p className="font-sans text-[0.85rem] text-[#7A5C4E]">—</p>
              ) : (
                <ol className="space-y-2">
                  {data.top.map((a, i) => (
                    <li key={a.id}>
                      <Link
                        href={`/artwork/${a.id}`}
                        className="flex items-center gap-3 p-2 border border-[rgba(107,30,46,0.1)] hover:bg-[#F5EFE0] transition-colors"
                      >
                        <span className="font-serif text-[1rem] text-[#9C7A6A] w-5 text-center">{i + 1}</span>
                        <span className="w-12 h-12 relative bg-[#EDE4CE] shrink-0">
                          {a.image && <Image src={a.image} alt="" fill sizes="48px" className="object-cover" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-serif text-[1rem] text-[#2C1810] truncate">{a.title}</span>
                          <span className="block font-sans text-[0.75rem] text-[#7A5C4E]">
                            {t("analytics.topViews", { n: a.views })} · ♥ {a.likes}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <h3 className="font-serif text-[1.15rem] text-[#2C1810] mb-3">{t("analytics.channels")}</h3>
              <div className="grid grid-cols-3 gap-3">
                {(["whatsapp", "instagram", "email"] as const).map((ch) => (
                  <div key={ch} className="border border-[rgba(107,30,46,0.12)] p-4 text-center">
                    <span className="block font-serif text-[1.8rem] text-[#6B1E2E] leading-none">{data.channels[ch]}</span>
                    <span className="font-sans text-[0.68rem] uppercase tracking-widest text-[#9C7A6A]">{t(`analytics.${ch}` as "analytics.email")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
