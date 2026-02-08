import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsSheetActionsProps {
  className?: string;
  children: React.ReactNode;
}

export function DsSheetActions({ className, children }: DsSheetActionsProps) {
  return (
    <div
      className={cn(
        "border-t border-[var(--border-subtle)] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-[var(--surface-0)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

