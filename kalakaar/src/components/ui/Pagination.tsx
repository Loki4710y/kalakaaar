import Link from "next/link";

/** Page numbers to show: 1 … 4 5 6 … 20 (always real links, so search engines can follow them). */
function windowed(page: number, total: number): (number | "gap")[] {
  const set = new Set<number>([1, total, page - 1, page, page + 1]);
  if (page <= 3) { set.add(2); set.add(3); }
  if (page >= total - 2) { set.add(total - 1); set.add(total - 2); }
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

const box = "w-8 h-8 flex items-center justify-center font-sans text-[0.9rem] border transition-colors";

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-16 border-t border-[rgba(107,30,46,0.18)] pt-10 flex items-center justify-center gap-2 flex-wrap">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" scroll aria-label="Previous page" className="w-8 h-8 flex items-center justify-center font-sans text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors">←</Link>
      ) : (
        <span aria-hidden className="w-8 h-8 flex items-center justify-center font-sans text-[#7A5C4E] opacity-50">←</span>
      )}

      {windowed(page, totalPages).map((n, i) =>
        n === "gap" ? (
          <span key={`g${i}`} className="w-6 text-center font-sans text-[#7A5C4E]">…</span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            scroll
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={`${box} ${n === page ? "text-[#FFFDF7] bg-[#6B1E2E] border-[#6B1E2E]" : "text-[#7A5C4E] border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E]"}`}
          >
            {n}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" scroll aria-label="Next page" className="w-8 h-8 flex items-center justify-center font-sans text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors">→</Link>
      ) : (
        <span aria-hidden className="w-8 h-8 flex items-center justify-center font-sans text-[#7A5C4E] opacity-50">→</span>
      )}
    </nav>
  );
}
