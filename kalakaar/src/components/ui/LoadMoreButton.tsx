"use client";

/** "Show more" button for lists paginated on the server. Renders nothing when everything is shown. */
export function LoadMoreButton({
  shown, total, loading, failed, onClick,
}: { shown: number; total: number; loading: boolean; failed?: boolean; onClick: () => void }) {
  if (shown >= total) return null;
  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="px-8 py-3 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors disabled:opacity-60"
      >
        {loading ? "Loading…" : "Show more"}
      </button>
      <span className="font-sans text-[0.75rem] text-[#7A5C4E]">Showing {shown} of {total}</span>
      {failed && <span className="font-sans text-[0.75rem] text-red-700">Could not load more. Please try again.</span>}
    </div>
  );
}
