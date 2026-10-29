"use client";

import React, { useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Gives every page change a soft fade-and-rise. The very first page a visitor lands on is NOT animated,
 * so the first paint is never delayed (that keeps loading speed scores honest).
 * It only reacts to a change of page, not to filters or page numbers on the same page.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const first = useRef(pathname);
  const animate = pathname !== first.current;
  return (
    <div key={pathname} className={animate ? "kk-page-enter" : undefined}>
      {children}
    </div>
  );
}
