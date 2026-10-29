"use client";
import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
/** Bot protection is on only when a Turnstile site key is configured. Without it, signup works as before. */
export const TURNSTILE_ENABLED = !!SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Cloudflare Turnstile widget. Calls `onToken` with a token once the visitor passes the check ("" if it expires). */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let widgetId: string | undefined;
    let cancelled = false;

    const mount = () => {
      if (cancelled || !box.current || !window.turnstile) return;
      widgetId = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    if (window.turnstile) mount();
    else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={box} className="flex justify-center" />;
}
