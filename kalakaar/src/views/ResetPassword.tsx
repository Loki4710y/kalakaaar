"use client";
import React, { useState } from "react";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";
import { GoldButton } from "../components/ui/GoldButton";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function ResetPassword() {
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = "Passwords do not match.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        const msg = error.message || "Failed to update password. Please request a new reset link.";
        setErrorMsg(msg);
        toast.error(msg);
      } else {
        setIsSuccess(true);
        toast.success("Password updated successfully!");
      }
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#FDFBF7] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply flex items-center justify-center">
        <MadhubaniPattern stroke="#6B1E2E" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] shadow-2xl p-8 sm:p-12 text-center animate-in fade-in duration-500">
        {/* Corner Decors */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#6B1E2E]/40"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#6B1E2E]/40"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#6B1E2E]/40"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#6B1E2E]/40"></div>

        <div className="mx-auto w-16 h-16 rounded-full bg-[rgba(107,30,46,0.08)] flex items-center justify-center text-[#6B1E2E] mb-6 border border-[rgba(107,30,46,0.15)]">
          {isSuccess ? <CheckCircle2 size={32} /> : <KeyRound size={32} />}
        </div>

        {isSuccess ? (
          <div>
            <h1 className="font-serif text-[2.2rem] text-[#2C1810] leading-tight mb-3">
              Password Reset Complete
            </h1>
            <p className="font-sans text-[0.95rem] text-[#7A5C4E] mb-8 leading-relaxed">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <Link
              href="/auth?mode=signin"
              className="w-full text-center py-3.5 bg-[#6B1E2E] text-white font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold hover:bg-[#8A2B3E] transition-colors flex items-center justify-center gap-2"
            >
              Sign In Now →
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="font-serif text-[2.2rem] text-[#2C1810] leading-tight mb-2">
              Set New Password
            </h1>
            <p className="font-sans text-[0.9rem] text-[#7A5C4E] mb-8 leading-relaxed">
              Please enter your new password below.
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 bg-[#FFF5F5] border border-[#E53E3E] text-[#C53030] font-sans text-[0.85rem] text-left leading-relaxed flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <label className="font-sans text-[0.8rem] text-[#7A5C4E] uppercase tracking-[0.1em] mb-2 block">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="appearance-none rounded-none w-full px-4 py-3 border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] text-[#2C1810] font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors"
                />
              </div>

              <div>
                <label className="font-sans text-[0.8rem] text-[#7A5C4E] uppercase tracking-[0.1em] mb-2 block">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  className="appearance-none rounded-none w-full px-4 py-3 border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] text-[#2C1810] font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors"
                />
              </div>

              <GoldButton
                variant="primary"
                type="submit"
                disabled={isLoading}
                className="w-full justify-center py-3.5 text-[0.85rem]"
              >
                {isLoading ? "Updating Password..." : "Update Password"}
              </GoldButton>
            </form>

            <div className="mt-8 pt-6 border-t border-[rgba(107,30,46,0.18)]">
              <Link
                href="/auth?mode=signin"
                className="font-sans text-[0.85rem] text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
