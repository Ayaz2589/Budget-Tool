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
        "grid w-full rounded-2xl bg-[var(--surface-2)] p-1 ring-1 ring-[var(--border-subtle)]",
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
              "h-11 rounded-xl px-2 text-sm font-medium transition-colors ds-label",
              isActive
                ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
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

