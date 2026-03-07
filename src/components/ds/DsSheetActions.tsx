import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsSheetActionsProps {
  className?: string;
  children: React.ReactNode;
}

export function DsSheetActions({ className, children }: DsSheetActionsProps) {
  return (
    <div className="shrink-0 border-t border-[var(--border-subtle)]">
      <div
        className={cn(
          "px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
