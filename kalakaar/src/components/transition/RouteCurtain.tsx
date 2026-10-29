"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type State = "idle" | "covering" | "covered" | "revealing";

const COVER_MS = 480; // must match kk-curtain-cover in globals.css
const REVEAL_MS = 620; // must match kk-curtain-reveal
const MIN_COVERED_MS = 700; // never flash: the mark stays visible at least this long
const MAX_WAIT_MS = 4000; // if the next page is very slow, lift the curtain anyway

/** "/explore?x=1" and "/artwork/abc" -> "explore", "artwork". Moving between sections gets the curtain. */
const section = (path: string) => path.split("/")[1] || "";

/**
 * A burgundy curtain that wipes up over the page when a visitor moves to another part of the site,
 * hides the loading, and lifts once the new page is ready. Left alone: new tabs, modified clicks,
 * the same section (a light fade handles those), the browser's back/forward, and reduced-motion users.
 */
export function RouteCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");
  const stateRef = useRef<State>("idle");
  const pathRef = useRef(pathname);
  const startedAt = useRef(0);
  const timers = useRef<number[]>([]);

  const set = useCallback((s: State) => {
    stateRef.current = s;
    setState(s);
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const reveal = useCallback(() => {
    clearTimers();
    set("revealing");
    later(() => {
      set("idle");
      // Move keyboard / screen-reader focus to the new page's heading.
      const h = document.querySelector<HTMLElement>("main h1, h1");
      if (h) {
        h.setAttribute("tabindex", "-1");
        h.focus({ preventScroll: true });
      }
    }, REVEAL_MS);
  }, [later, set]);

  // The new page has arrived: lift the curtain (but not before the minimum time has passed).
  useEffect(() => {
    if (pathname === pathRef.current) return;
    pathRef.current = pathname;
    if (stateRef.current === "covering" || stateRef.current === "covered") {
      const wait = Math.max(0, MIN_COVERED_MS - (Date.now() - startedAt.current));
      later(reveal, wait);
    }
  }, [pathname, later, reveal]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (stateRef.current !== "idle") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page, filters, #hash
      if (section(url.pathname) === section(window.location.pathname)) return; // same section: light fade only
      if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/callback")) return;

      e.preventDefault(); // stops next/link from navigating by itself
      const href = url.pathname + url.search + url.hash;
      startedAt.current = Date.now();
      set("covering");
      router.prefetch(href);
      later(() => {
        if (stateRef.current === "covering") set("covered");
        router.push(href);
      }, COVER_MS);
      later(() => {
        if (stateRef.current === "covering" || stateRef.current === "covered") reveal();
      }, MAX_WAIT_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, [later, reveal, router, set]);

  return (
    <div className="kk-curtain" data-route-curtain data-state={state} aria-hidden="true">
      {state !== "idle" && (
        <>
          <span className="kk-curtain-mark">Kalakaar</span>
          <span className="kk-curtain-line" />
        </>
      )}
    </div>
  );
}
