"use client";
import React, { useState } from "react";
import { Flag, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { reportRepository, ReportItemType } from "../../repositories/ReportRepository";
import { notify } from "../../lib/notify";

const REASONS = ["Spam or fake", "Not original / copied work", "Inappropriate content", "Wrong or misleading details", "Other"];

interface ReportButtonProps {
  itemType: ReportItemType;
  itemId: string;
  ownerId?: string;
  className?: string;
}

export function ReportButton({ itemType, itemId, ownerId, className = "" }: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  // Nothing to report on your own content.
  if (user && ownerId && user.id === ownerId) return null;

  const start = () => {
    if (!user) {
      notify.info("Please log in to report.");
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setSending(true);
    const res = await reportRepository.createReport(itemType, itemId, `${reason}${details.trim() ? `: ${details.trim()}` : ""}`);
    setSending(false);
    if (res.success) {
      notify.success("Thanks, we will review this.");
      setOpen(false);
      setDetails("");
    } else {
      notify.error(res.error || "Could not send your report.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={`inline-flex items-center gap-1.5 font-sans text-[0.75rem] text-[#9C7A6A] hover:text-[#6B1E2E] transition-colors ${className}`}
      >
        <Flag size={13} /> Report
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2C1810]/60" role="dialog" aria-modal="true" aria-label="Report">
          <div className="w-full max-w-md bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 relative">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute top-3 right-3 text-[#7A5C4E] hover:text-[#6B1E2E]">
              <X size={18} />
            </button>
            <h3 className="font-serif text-[1.4rem] text-[#2C1810] mb-4">Report this {itemType}</h3>

            <label className="block font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] mb-2">What is wrong?</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-3 py-2.5 font-sans text-[#2C1810] mb-4 focus:outline-none focus:border-[#6B1E2E]"
            >
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>

            <label className="block font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Details (optional)</label>
            <textarea
              rows={3}
              maxLength={300}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-3 py-2.5 font-sans text-[#2C1810] resize-none mb-5 focus:outline-none focus:border-[#6B1E2E]"
            />

            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="w-full px-6 py-3 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[#8A2B3E] transition-colors disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send report"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
