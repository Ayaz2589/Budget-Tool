import type * as React from "react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface DsActionBarProps {
  className?: string;
  children: React.ReactNode;
  mobileOnly?: boolean;
}

export function DsActionBar({ className, children, mobileOnly = true }: DsActionBarProps) {
  return (
    <div className={cn(
      "fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-30 px-4 pb-3 pointer-events-none",
      mobileOnly ? "md:hidden" : "md:bottom-4",
      className,
    )}>
      <div className="pointer-events-auto flex items-center justify-end">
        <div
          className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-background/20 shadow-lg shadow-black/30 backdrop-blur px-2 py-2"
          onClickCapture={() => triggerHaptic()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
