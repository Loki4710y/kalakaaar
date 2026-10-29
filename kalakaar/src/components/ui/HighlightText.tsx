"use client";
import React from "react";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, query, className = "" }) => {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const trimmedQuery = query.trim();
  // Escape special regex chars
  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark
            key={index}
            className="bg-[#C8A84B]/30 text-[#6B1E2E] font-semibold px-0.5 rounded-none"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};
