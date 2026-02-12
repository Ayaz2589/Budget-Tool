import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  valueIso?: string | null;
  onChangeIso: (isoDate: string) => void;
  triggerLabel: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIso(iso?: string | null): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const parsed = new Date(`${iso}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function buildCalendarDays(viewDate: Date): Date[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const startOffset = first.getDay();
  const daysInMonth = last.getDate();

  const days: Date[] = [];
  for (let i = 0; i < startOffset; i += 1) {
    days.push(new Date(year, month, i - startOffset + 1));
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }
  while (days.length < 42) {
    const nextDay = days.length - (startOffset + daysInMonth) + 1;
    days.push(new Date(year, month + 1, nextDay));
  }
  return days;
}

export function DatePicker({
  valueIso,
  onChangeIso,
  triggerLabel,
  placeholder,
  className,
  triggerClassName,
}: DatePickerProps) {
  const selectedDate = useMemo(() => fromIso(valueIso), [valueIso]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate ?? new Date());

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const currentMonth = viewDate.getMonth();
  const selectedIso = selectedDate ? toIso(selectedDate) : null;
  const todayIso = toIso(new Date());

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setViewDate(selectedDate ?? new Date());
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("justify-start px-3 font-normal", triggerClassName)}
        >
          {triggerLabel || placeholder || "Select date"}
        </Button>
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
              onClick={() =>
                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="text-sm font-semibold">{monthLabel(viewDate)}</div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-8"
              onClick={() =>
                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const iso = toIso(date);
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isSelected = selectedIso === iso;
              const isToday = todayIso === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChangeIso(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 rounded-md text-sm transition-colors",
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                    isSelected && "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)]",
                    !isSelected && "hover:bg-[var(--control-hover)]",
                    isToday && !isSelected && "ring-1 ring-[var(--focus-ring)]",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

