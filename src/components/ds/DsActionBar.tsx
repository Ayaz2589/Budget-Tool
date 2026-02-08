import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsActionBarProps {
  className?: string;
  children: React.ReactNode;
}

export function DsActionBar({ className, children }: DsActionBarProps) {
  return (
    <div className={cn("md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-30 px-4 pb-3 pointer-events-none", className)}>
      <div className="pointer-events-auto flex items-center justify-end">
        <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-background/20 shadow-lg shadow-black/30 backdrop-blur px-2 py-2">
          {children}
        </div>
      </div>
    </div>
  );
}
