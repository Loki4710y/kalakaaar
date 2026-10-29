"use client";
import React from "react";
import { cn } from "../../lib/utils";

export interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  children: React.ReactNode;
}

export function GoldButton({ variant = "primary", className, children, ...props }: GoldButtonProps) {
  return (
    <button
      className={cn(
        "font-sans text-[0.82rem] font-medium uppercase tracking-[0.08em] px-[2rem] py-[0.85rem] flex items-center justify-center transition-all duration-250 cursor-pointer rounded-none outline-none",
        variant === "primary"
          ? "border-[1px] border-primary bg-primary text-surface hover:bg-primary-hover hover:border-primary-hover"
          : "border-[1px] border-primary text-primary bg-transparent hover:bg-primary hover:text-surface",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}


