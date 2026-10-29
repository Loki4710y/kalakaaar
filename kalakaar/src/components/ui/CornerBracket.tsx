"use client";
import { cn } from "../../lib/utils";

export function CornerBracket({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <div className="absolute top-0 left-0 w-[30px] h-[30px] border-t-2 border-l-2 border-primary" />
      <div className="absolute top-0 right-0 w-[30px] h-[30px] border-t-2 border-r-2 border-primary" />
      <div className="absolute bottom-0 left-0 w-[30px] h-[30px] border-b-2 border-l-2 border-primary" />
      <div className="absolute bottom-0 right-0 w-[30px] h-[30px] border-b-2 border-r-2 border-primary" />
    </div>
  );
}

