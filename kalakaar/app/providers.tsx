"use client";
import { useEffect, useState } from "react";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { StoreProvider } from "@/src/contexts/StoreContext";
import { AmbientProvider } from "@/src/contexts/AmbientContext";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { installGlobalErrorHandlers } from "@/src/lib/monitoring";
// Decoration only: keep it out of the first load so the page itself shows up sooner.
const MicroAnimations = dynamic(() => import("@/src/components/ambient/MicroAnimations").then((m) => m.MicroAnimations), { ssr: false });
const TimeThemeOverlay = dynamic(() => import("@/src/components/ambient/TimeThemeOverlay").then((m) => m.TimeThemeOverlay), { ssr: false });
const AmbientPanel = dynamic(() => import("@/src/components/ambient/AmbientPanel").then((m) => m.AmbientPanel), { ssr: false });

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return installGlobalErrorHandlers();
  }, []);

  return (
    <LanguageProvider>
    <AuthProvider>
      <StoreProvider>
        <AmbientProvider>
          {mounted && <MicroAnimations />}
          {mounted && <TimeThemeOverlay />}
          {mounted && <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#2C1810', color: '#FFFDF7' } }} />}
          {children}
          {mounted && <AmbientPanel />}
        </AmbientProvider>
      </StoreProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
