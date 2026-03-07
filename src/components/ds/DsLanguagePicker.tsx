import { useState } from "react";
import { Globe, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LANGUAGE_OPTIONS } from "@/components/layout/layoutConstants";

interface DsLanguagePickerProps {
  value: string;
  onChange: (locale: string) => void;
  /** Compact mode: icon-only trigger (used when sidebar is collapsed) */
  compact?: boolean;
  className?: string;
}

export function DsLanguagePicker({
  value,
  onChange,
  compact,
  className,
}: DsLanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const currentLabel =
    LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-control)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]/45",
            compact
              ? "justify-center size-10 text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)]"
              : "w-full border border-[var(--control-border)] bg-[var(--control-surface)] px-3 h-11 min-h-[44px] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--control-hover)] hover:border-[var(--border-strong)]",
            className,
          )}
        >
          <Globe className={compact ? "size-4" : "size-3.5 shrink-0 text-[var(--text-secondary)]"} />
          {!compact && (
            <span className="flex-1 text-left truncate">{currentLabel}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={compact ? "right" : "top"}
        align={compact ? "end" : "start"}
        className="w-48 p-1"
      >
        <div className="flex flex-col">
          {LANGUAGE_OPTIONS.map((option) => {
            const isActive = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex items-center justify-between gap-2 rounded-[calc(var(--radius-control)-4px)] px-2.5 py-2 text-sm transition-colors select-none",
                  isActive
                    ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)] font-medium"
                    : "text-[var(--text-primary)] hover:bg-[var(--control-hover)]",
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isActive && <Check className="size-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
