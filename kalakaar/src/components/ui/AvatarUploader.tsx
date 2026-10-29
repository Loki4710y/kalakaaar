"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2, Trash2 } from "lucide-react";
import { StorageService } from "../../../services/StorageService";
import { useLanguage } from "../../contexts/LanguageContext";

const MAX_BYTES = 10 * 1024 * 1024; // the file is shrunk to a small WebP before upload
const ACCEPT = "image/jpeg,image/png,image/webp";

interface Props {
  userId: string;
  /** Current picture (https url) or empty. */
  value: string;
  /** First letter shown when there is no picture. */
  fallbackLetter?: string;
  /** Called with the new public url after a successful upload, or "" when removed. Return false if saving it failed. */
  onChange: (url: string) => void | boolean | Promise<void | boolean>;
  /** Called with a short status for the page's own message area (optional). */
  onStatus?: (kind: "success" | "error", text: string) => void;
  disabled?: boolean;
}

/**
 * Profile picture picker: drag a photo onto the circle, or click it / the button to choose from the
 * gallery or files. On phones the same button opens the gallery or camera.
 */
export function AvatarUploader({ userId, value, fallbackLetter = "U", onChange, onStatus, disabled }: Props) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const report = useCallback(
    (kind: "success" | "error", text: string) => {
      setError(kind === "error" ? text : "");
      onStatus?.(kind, text);
    },
    [onStatus]
  );

  const upload = useCallback(
    async (file: File | undefined | null) => {
      if (!file || busy || disabled) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        report("error", t("avatar.badType"));
        return;
      }
      if (file.size > MAX_BYTES) {
        report("error", t("avatar.tooBig"));
        return;
      }
      setBusy(true);
      setError("");
      try {
        const res = await StorageService.uploadAvatar(file, userId);
        if (res.success && res.data?.publicUrl) {
          const saved = await onChange(res.data.publicUrl);
          if (saved === false) report("error", t("avatar.saveFailed"));
          else report("success", t("avatar.uploaded"));
        } else {
          report("error", res.error || t("avatar.failed"));
        }
      } catch {
        report("error", t("avatar.failed"));
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = ""; // lets the same file be chosen again
      }
    },
    [busy, disabled, onChange, report, t, userId]
  );

  const hasPhoto = /^(https?:\/\/|\/)/.test(value);
  const pick = () => !busy && !disabled && inputRef.current?.click();

  return (
    <div className="flex flex-col items-center w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label={t("avatar.choose")}
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files?.[0]);
        }}
        className={`relative w-[140px] h-[140px] rounded-full border-2 p-1 mb-3 bg-[#F5F2EA] overflow-hidden cursor-pointer group transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] focus-visible:ring-offset-2 ${
          dragging ? "border-dashed border-[#6B1E2E] bg-[#EDE4CE]" : "border-[#6B1E2E]"
        }`}
      >
        {hasPhoto ? (
          <Image src={value} alt="" fill sizes="140px" className="object-cover rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full rounded-full bg-[#E8E2D2] flex items-center justify-center text-[#9C7A6A] font-serif text-4xl">
            {fallbackLetter.charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className={`absolute inset-1 rounded-full bg-black/45 flex flex-col items-center justify-center text-white text-center transition-opacity ${
            busy || dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
          }`}
        >
          {busy ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> : <UploadCloud className="w-6 h-6" aria-hidden="true" />}
          <span className="font-sans text-[0.65rem] uppercase tracking-wider mt-1 px-2">
            {busy ? t("avatar.uploading") : dragging ? t("avatar.drop") : t("avatar.dragHere")}
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={busy || disabled}
        onChange={(e) => void upload(e.target.files?.[0])}
      />

      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[260px]">
        <button
          type="button"
          onClick={pick}
          disabled={busy || disabled}
          className="flex-1 px-4 py-2 border border-[#6B1E2E] text-[#6B1E2E] hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors font-sans text-[0.72rem] uppercase tracking-[0.1em] font-semibold cursor-pointer disabled:opacity-60"
        >
          {busy ? t("avatar.uploading") : t("avatar.choose")}
        </button>
        {hasPhoto && (
          <button
            type="button"
            onClick={() => void onChange("")}
            disabled={busy || disabled}
            aria-label={t("avatar.remove")}
            title={t("avatar.remove")}
            className="px-3 py-2 border border-[rgba(107,30,46,0.3)] text-[#7A5C4E] hover:text-[#6B1E2E] hover:bg-[rgba(107,30,46,0.06)] transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="font-sans text-[0.72rem] text-[#9C7A6A] mt-2 text-center">{t("avatar.hint")}</p>
      {error && (
        <p role="alert" className="font-sans text-[0.78rem] text-[#B3261E] mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
