import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MonthYearPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  triggerLabel?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

function parseYear(value?: string): number {
  if (!value) return new Date().getFullYear();
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date().getFullYear();
  return Number(match[1]);
}

function toMonthValue(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function monthLabel(monthIndex: number): string {
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(
    new Date(2020, monthIndex, 1),
  );
}

export function MonthYearPicker({
  value = "",
  onChange,
  triggerLabel,
  placeholder = "YYYY-MM",
  className,
  triggerClassName,
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => parseYear(value));

  const selected = useMemo(() => value.match(/^(\d{4})-(\d{2})$/), [value]);
  const selectedYear = selected ? Number(selected[1]) : null;
  const selectedMonth = selected ? Number(selected[2]) - 1 : null;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setViewYear(parseYear(value));
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-start gap-2 rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--field-surface)] px-3 text-sm text-[var(--text-primary)] shadow-[var(--field-shadow)] transition-[background-color,border-color,box-shadow,color] outline-none hover:bg-[var(--control-hover)] hover:border-[var(--border-strong)] focus-visible:border-[var(--focus-ring)] focus-visible:ring-[var(--focus-ring)]/45 focus-visible:ring-[3px]",
            triggerClassName,
          )}
        >
          {triggerLabel || value || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "w-[var(--radix-popover-trigger-width)] max-w-none p-3",
          className,
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-8"
              onClick={() => setViewYear((prev) => prev - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="text-sm font-semibold">{viewYear}</div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-8"
              onClick={() => setViewYear((prev) => prev + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, monthIndex) => {
              const monthValue = toMonthValue(viewYear, monthIndex);
              const isSelected =
                selectedYear === viewYear && selectedMonth === monthIndex;
              return (
                <button
                  key={monthValue}
                  type="button"
                  onClick={() => {
                    onChange(monthValue);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 rounded-md text-sm transition-colors",
                    isSelected
                      ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)]"
                      : "text-foreground hover:bg-[var(--control-hover)]",
                  )}
                >
                  {monthLabel(monthIndex)}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

