"use client";
import React, { useEffect, useState } from "react";
import { LoadMoreButton } from "../../ui/LoadMoreButton";
import { useServerPages } from "../../../hooks/useServerPages";
import { Flag, Users, Image as ImageIcon, BookOpen, AlertTriangle, Eye, X } from "lucide-react";
import { AdminService, AdminReport } from "../../../../services/AdminService";

const REPORT_PAGE = 20;

export function AdminReportsView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"artwork" | "artist" | "story">("artwork");
  const [notice, setNotice] = useState<string | null>(null);
  const { items: reports, total, replace, loadMore, loadingMore, failed } = useServerPages<AdminReport>({ items: [], total: 0, page: 1 });
  const setReports = (fn: (prev: AdminReport[]) => AdminReport[]) => replace(fn(reports), total, Math.max(1, Math.ceil(reports.length / REPORT_PAGE)));

  // Modal Review State
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  // Each tab is its own server query, so switching tabs loads that type's first page
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    AdminService.getReportsPage(activeTab, 1, REPORT_PAGE).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) replace(res.data.items, res.data.total, 1);
      else replace([], 0, 1);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeTab, replace]);

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const filteredReports = reports;

  const handleUpdateStatus = async (
    id: string,
    status: "pending" | "reviewed" | "ignored" | "archived"
  ) => {
    const res = await AdminService.updateReportStatus(id, status);
    if (res.success) {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      showFeedback(`Report status updated to "${status}".`);
      setSelectedReport(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <Flag className="text-[#6B1E2E]" size={24} /> Community Moderation Reports
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Review community flags on artisan profiles, artworks, and folk lore stories.
          </p>
        </div>

        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(107,30,46,0.18)] bg-[#FFFDF7]">
        <button
          onClick={() => setActiveTab("artwork")}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "artwork"
              ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#F5EFE0]"
              : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
          }`}
        >
          <ImageIcon size={16} /> Reported Artworks
        </button>

        <button
          onClick={() => setActiveTab("artist")}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "artist"
              ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#F5EFE0]"
              : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
          }`}
        >
          <Users size={16} /> Reported Artists
        </button>

        <button
          onClick={() => setActiveTab("story")}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "story"
              ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#F5EFE0]"
              : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
          }`}
        >
          <BookOpen size={16} /> Reported Stories
        </button>
      </div>

      {/* List */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
        {loading ? (
          <div className="py-12 text-center font-serif text-sm text-[#2C1810]">
            Loading reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7A5C4E]">
            No pending or active moderation reports for this category.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[0.7rem] font-sans uppercase tracking-wider text-[#7A5C4E]">{total} report{total === 1 ? "" : "s"}</p>
            {filteredReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-[#2C1810]">
                      {rep.item_title}
                    </span>
                    <span
                      className={`text-[0.65rem] uppercase font-bold px-2 py-0.5 ${
                        rep.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : rep.status === "reviewed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-[#7A5C4E]">
                    Reported by <strong>{rep.reporter_name}</strong> on {rep.created_at}
                  </p>
                  <p className="font-sans text-xs text-[#2C1810] italic bg-[#EDE4CE]/60 p-2 border-l-2 border-[#6B1E2E]">
                    Reason: &ldquo;{rep.reason}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="px-3 py-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white text-[#2C1810] font-sans text-xs uppercase font-bold transition-colors flex items-center gap-1"
                  >
                    <Eye size={14} /> Review
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(rep.id, "ignored")}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-sans text-xs uppercase font-bold transition-colors"
                  >
                    Ignore
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(rep.id, "archived")}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-sans text-xs uppercase font-bold transition-colors"
                  >
                    Take Down
                  </button>
                </div>
              </div>
            ))}
            <LoadMoreButton
              shown={reports.length}
              total={total}
              loading={loadingMore}
              failed={failed}
              onClick={() => loadMore(async (page) => {
                const res = await AdminService.getReportsPage(activeTab, page, REPORT_PAGE);
                return res.success && res.data ? { items: res.data.items, total: res.data.total } : null;
              })}
            />
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] border-2 border-[#6B1E2E] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[rgba(107,30,46,0.18)] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2C1810] flex items-center gap-2">
                <AlertTriangle className="text-[#6B1E2E]" size={18} /> Review Moderation Flag
              </h3>
              <button onClick={() => setSelectedReport(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 font-sans text-xs text-[#2C1810]">
              <p><strong>Item Title:</strong> {selectedReport.item_title}</p>
              <p><strong>Item Type:</strong> {selectedReport.item_type}</p>
              <p><strong>Reporter:</strong> {selectedReport.reporter_name}</p>
              <p><strong>Date Flagged:</strong> {selectedReport.created_at}</p>
              <div className="bg-[#F5EFE0] p-3 border border-[rgba(107,30,46,0.18)]">
                <strong>Flag Reason:</strong>
                <p className="mt-1 text-[#7A5C4E]">{selectedReport.reason}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(107,30,46,0.18)] flex justify-end gap-2">
              <button
                onClick={() => handleUpdateStatus(selectedReport.id, "reviewed")}
                className="px-4 py-2 bg-emerald-700 text-white font-sans text-xs uppercase font-bold"
              >
                Mark Reviewed
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReport.id, "archived")}
                className="px-4 py-2 bg-red-700 text-white font-sans text-xs uppercase font-bold"
              >
                Archive Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
