"use client";
import React, { useState } from "react";
import { Megaphone, Send, Info, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { AdminService } from "../../../../services/AdminService";

export function AdminBroadcastView() {
  const [title, setTitle] = useState("Kalakaar Monsoon Heritage Exhibition 2026");
  const [message, setMessage] = useState("We are thrilled to launch the monsoon collection celebrating traditional water motifs across Madhubani and Pattachitra.");
  const [type, setType] = useState<"info" | "success" | "warning" | "system">("info");

  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    const res = await AdminService.createAnnouncement({ title, message, type });
    if (res.success) {
      setNotice("Broadcast announcement sent successfully to all online patrons!");
      setTimeout(() => setNotice(null), 3000);
      setTitle("");
      setMessage("");
    }
    setSending(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <Megaphone className="text-[#6B1E2E]" size={24} /> System Broadcast Center
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Broadcast live announcements, exhibition notices, and system alerts to all Kalakaar users.
          </p>
        </div>

        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Column */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
          <h2 className="font-serif text-lg font-bold text-[#2C1810] mb-6 pb-2 border-b border-[rgba(107,30,46,0.12)]">
            Create Announcement
          </h2>

          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">
                Announcement Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                required
              />
            </div>

            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">
                Notification Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "info", label: "Information", icon: Info, color: "text-blue-700 border-blue-300" },
                  { id: "success", label: "Success", icon: CheckCircle2, color: "text-emerald-700 border-emerald-300" },
                  { id: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-700 border-amber-300" },
                  { id: "system", label: "System Alert", icon: ShieldAlert, color: "text-red-700 border-red-300" },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as any)}
                      className={`p-2.5 border text-xs font-sans uppercase font-bold flex items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? "bg-[#6B1E2E] text-white border-[#6B1E2E]"
                          : "bg-[#F5EFE0] text-[#2C1810] border-[rgba(107,30,46,0.2)] hover:bg-[#EDE4CE]"
                      }`}
                    >
                      <Icon size={14} /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">
                Message Body
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement content here..."
                className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Send size={16} />
              {sending ? "Broadcasting..." : "Broadcast Announcement"}
            </button>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#2C1810] pb-2 border-b border-[rgba(107,30,46,0.12)]">
            Live User Banner Preview
          </h2>

          <p className="font-sans text-xs text-[#7A5C4E]">
            This is how the broadcast message will render across top user navigation banners:
          </p>

          {/* Banner Card */}
          <div
            className={`p-4 border-l-4 shadow-md transition-all ${
              type === "info"
                ? "bg-blue-50 border-blue-600 text-blue-950"
                : type === "success"
                ? "bg-emerald-50 border-emerald-600 text-emerald-950"
                : type === "warning"
                ? "bg-amber-50 border-amber-600 text-amber-950"
                : "bg-red-50 border-red-600 text-red-950"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {type === "info" && <Info size={18} className="text-blue-600" />}
                {type === "success" && <CheckCircle2 size={18} className="text-emerald-600" />}
                {type === "warning" && <AlertTriangle size={18} className="text-amber-600" />}
                {type === "system" && <ShieldAlert size={18} className="text-red-600" />}
              </div>

              <div>
                <h3 className="font-serif text-sm font-bold">
                  {title || "Announcement Title"}
                </h3>
                <p className="font-sans text-xs mt-1 leading-relaxed">
                  {message || "Announcement body text will appear here..."}
                </p>
                <span className="font-sans text-[0.65rem] uppercase font-bold tracking-wider opacity-70 block mt-2">
                  Broadcast by Kalakaar Admin • Just now
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
