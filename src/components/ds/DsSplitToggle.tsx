import type * as React from "react";
import { cn } from "@/lib/utils";

export interface DsSplitToggleOption {
  value: string;
  label: React.ReactNode;
}

interface DsSplitToggleProps {
  value: string;
  onChange: (value: string) => void;
  options: DsSplitToggleOption[];
  className?: string;
}

export function DsSplitToggle({
  value,
  onChange,
  options,
  className,
}: DsSplitToggleProps) {
  return (
    <div
      className={cn(
        "grid w-full rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--control-surface)] p-1",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "h-11 min-h-[44px] rounded-[calc(var(--radius-control)-4px)] px-2 text-sm font-medium transition-colors ds-label focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]/45",
              isActive
                ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)]",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
