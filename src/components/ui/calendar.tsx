import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute left-1 size-7 p-0"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute right-1 size-7 p-0"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-[0.75rem] font-medium text-[var(--text-secondary)] text-center",
        week: "mt-1 flex w-full",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button:
          "inline-flex size-9 items-center justify-center rounded-md text-[var(--text-primary)] hover:bg-[var(--control-hover)] aria-selected:bg-[var(--interactive-primary)] aria-selected:text-[var(--interactive-primary-foreground)]",
        today: "ring-1 ring-[var(--focus-ring)]",
        outside: "text-[var(--text-muted)] opacity-50",
        disabled: "text-[var(--text-muted)] opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...iconProps} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...iconProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
