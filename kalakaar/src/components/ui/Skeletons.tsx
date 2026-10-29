"use client";

import React from "react";

function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[rgba(107,30,46,0.08)] animate-pulse rounded-xs ${className}`}
      aria-hidden="true"
    />
  );
}

export function ArtworkCardSkeleton() {
  return (
    <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] overflow-hidden p-3 space-y-3 shadow-2xs">
      <SkeletonPulse className="w-full aspect-4/3 sm:aspect-square" />
      <div className="space-y-2">
        <SkeletonPulse className="h-4 w-3/4" />
        <SkeletonPulse className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2 border-t border-[rgba(107,30,46,0.1)]">
          <SkeletonPulse className="h-5 w-20" />
          <SkeletonPulse className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ArtworkGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ArtworkCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonPulse className="h-10 w-full max-w-xl mx-auto" />
      <div className="flex gap-4 justify-center">
        <SkeletonPulse className="h-8 w-24" />
        <SkeletonPulse className="h-8 w-24" />
        <SkeletonPulse className="h-8 w-24" />
      </div>
      <ArtworkGridSkeleton count={6} />
    </div>
  );
}
