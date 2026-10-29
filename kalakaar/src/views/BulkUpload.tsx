"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AccessDenied } from "../components/auth/AccessDenied";
import { StorageService } from "../../services/StorageService";
import { ArtworkService } from "../../services/ArtworkService";
import { artCategories } from "./UploadArtwork";

const MAX_FILES = 20; // the database also limits uploads to 40 artworks per hour

type RowStatus = "ready" | "uploading" | "done" | "error";
interface Row {
  id: string;
  file: File;
  preview: string;
  title: string;
  status: RowStatus;
  error?: string;
  artworkId?: string;
}

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const cleaned = base.length >= 2 ? base : "Untitled artwork";
  return (cleaned.charAt(0).toUpperCase() + cleaned.slice(1)).slice(0, 120);
}

/** Quick add: pick many photos at once; each becomes a DRAFT the artist finishes later. */
export function BulkUpload() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [category, setCategory] = useState("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const rowsRef = useRef<Row[]>([]);
  rowsRef.current = rows;

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth?mode=signin&redirect=/artist-portal/bulk");
  }, [authLoading, user, router]);

  // Free the preview URLs when leaving the page.
  useEffect(() => () => rowsRef.current.forEach((r) => URL.revokeObjectURL(r.preview)), []);

  if (authLoading || !user) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="animate-spin text-[#6B1E2E]" /></div>;
  }
  const isArtist = user.role === "artist" || user.role === "admin" || user.role === "super_admin";
  if (!isArtist) {
    return <AccessDenied title="Artist Portal Restricted" requiredRole="Artist or Admin" message="Bulk upload is reserved for registered artists." />;
  }

  const patchRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    if (rows.length + files.length > MAX_FILES) {
      setMessage(`You can add up to ${MAX_FILES} photos at a time.`);
      return;
    }
    const added: Row[] = [];
    for (const file of files) {
      const val = StorageService.validateFile(file, "artworks");
      if (!val.success) {
        setMessage(`${file.name}: ${val.error || "invalid file"}`);
        continue;
      }
      added.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
        title: titleFromFilename(file.name),
        status: "ready",
      });
    }
    if (added.length) {
      setMessage(null);
      setRows((prev) => [...prev, ...added]);
    }
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      const r = prev.find((x) => x.id === id);
      if (r) URL.revokeObjectURL(r.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const start = async () => {
    if (!category) { setMessage("Please choose a category first."); return; }
    const todo = rows.filter((r) => r.status === "ready" || r.status === "error");
    if (!todo.length) return;
    if (todo.some((r) => !r.title.trim())) { setMessage("Every photo needs a title."); return; }
    setMessage(null);
    setRunning(true);

    // One at a time: gentle on mobile data and on the rate limit.
    for (const row of todo) {
      patchRow(row.id, { status: "uploading", error: undefined });
      try {
        const up = await StorageService.uploadFile({ file: row.file, bucket: "artworks", ownerId: user.id });
        if (!up.success || !up.data?.publicUrl) {
          patchRow(row.id, { status: "error", error: up.error || "Image upload failed" });
          continue;
        }
        const res = await ArtworkService.createArtwork({
          artist_id: user.id,
          title: row.title.trim(),
          description: "",
          category,
          medium: "Mixed Media",
          materials: "Canvas",
          tags: [],
          creation_year: new Date().getFullYear(),
          dimensions: "",
          image_urls: [up.data.publicUrl],
          cover_image_index: 0,
          status: "draft",
        } as any);
        if (res.success) patchRow(row.id, { status: "done", artworkId: (res.data as any)?.id });
        else patchRow(row.id, { status: "error", error: res.error || "Could not save" });
      } catch (err: any) {
        patchRow(row.id, { status: "error", error: err?.message || "Something went wrong" });
      }
    }
    setRunning(false);
  };

  const done = rows.filter((r) => r.status === "done").length;
  const failed = rows.filter((r) => r.status === "error").length;
  const pending = rows.filter((r) => r.status === "ready" || r.status === "error").length;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Link href="/artist-portal" className="font-sans text-[0.8rem] text-[#7A5C4E] hover:text-[#6B1E2E]">← Back to Artist Portal</Link>
        <h1 className="font-serif text-[2.2rem] text-[#2C1810] mt-3 mb-2">Quick add many artworks</h1>
        <p className="font-sans text-[0.95rem] text-[#7A5C4E] mb-8">
          Pick up to {MAX_FILES} photos. Each one is saved as a <strong>draft</strong>. Later, open each draft to add price, size and story, then publish.
        </p>

        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-5 mb-6">
          <label htmlFor="bulk-cat" className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Category for all photos *</label>
          <select id="bulk-cat" value={category} onChange={(e) => setCategory(e.target.value)} disabled={running}
            className="w-full border border-[rgba(107,30,46,0.25)] bg-white px-3 py-3 font-sans text-sm text-[#2C1810]">
            <option value="">Select a category</option>
            {artCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[rgba(107,30,46,0.3)] bg-[#FFFDF7] py-10 px-4 text-center cursor-pointer hover:bg-[rgba(107,30,46,0.03)] ${running ? "opacity-50 pointer-events-none" : ""}`}>
          <UploadCloud className="text-[#6B1E2E]" />
          <span className="font-sans text-sm font-semibold text-[#2C1810]">Tap to choose photos</span>
          <span className="font-sans text-xs text-[#9C7A6A]">JPG, PNG or WebP</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={onSelect} disabled={running} />
        </label>

        {message && (
          <div role="alert" className="mt-4 p-3 border border-[#E53E3E] bg-[#FFF5F5] text-[#C53030] text-sm">{message}</div>
        )}

        {rows.length > 0 && (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 bg-[#FFFDF7] border border-[rgba(107,30,46,0.15)] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.preview} alt="" className="w-16 h-16 object-cover shrink-0 bg-[#EDE4CE]" />
                <div className="flex-1 min-w-0">
                  <input
                    value={r.title}
                    onChange={(e) => patchRow(r.id, { title: e.target.value.slice(0, 120) })}
                    disabled={running || r.status === "done"}
                    aria-label="Artwork title"
                    className="w-full border border-[rgba(107,30,46,0.2)] bg-white px-2 py-1.5 font-sans text-sm text-[#2C1810]"
                  />
                  {r.status === "error" && <p className="text-xs text-[#C53030] mt-1">{r.error}</p>}
                </div>
                <div className="w-24 text-right shrink-0">
                  {r.status === "uploading" && <Loader2 size={18} className="inline animate-spin text-[#6B1E2E]" />}
                  {r.status === "done" && (
                    <Link href={`/artist-portal/upload?edit=${r.artworkId}`} className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold">
                      <CheckCircle2 size={16} /> Edit
                    </Link>
                  )}
                  {r.status === "error" && <AlertCircle size={18} className="inline text-[#C53030]" />}
                  {(r.status === "ready" || r.status === "error") && !running && (
                    <button type="button" onClick={() => removeRow(r.id)} aria-label="Remove" className="ml-2 text-[#9C7A6A] hover:text-[#6B1E2E]"><X size={16} /></button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" onClick={start} disabled={running || pending === 0}
              className="px-6 py-3 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[#8A2B3E] disabled:opacity-50">
              {running ? "Saving…" : failed > 0 ? `Retry ${pending} photo${pending === 1 ? "" : "s"}` : `Save ${pending} as drafts`}
            </button>
            {done > 0 && !running && (
              <Link href="/artist-portal" className="font-sans text-sm text-[#6B1E2E] font-semibold underline">
                {done} saved. Go to portal to finish and publish
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
