import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground text-[var(--text-primary)] w-full min-w-0 max-w-full rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--field-surface)] px-3 py-2 shadow-[var(--field-shadow)] transition-[background-color,border-color,box-shadow,color] outline-none file:inline-flex file:h-9 file:border-0 file:bg-transparent file:text-sm file:font-medium enabled:hover:bg-[var(--control-hover)] enabled:hover:border-[var(--border-strong)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-[var(--focus-ring)] focus-visible:ring-[var(--focus-ring)]/45 focus-visible:ring-[3px] aria-invalid:ring-destructive/25 aria-invalid:border-destructive",
  {
    variants: {
      density: {
        compact: "h-10 text-sm",
        default: "h-11 min-h-[44px] text-base md:text-sm",
        comfortable: "h-12 min-h-[44px] text-base",
      },
      intent: {
        neutral: "",
        primary: "focus-visible:border-primary focus-visible:ring-primary/30",
        danger: "border-destructive/40 focus-visible:border-destructive",
        success: "focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30",
      },
      surface: {
        flat: "",
        raised: "bg-[var(--surface-1)]",
        glass: "bg-background/60 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      density: "default",
      intent: "neutral",
      surface: "flat",
    },
  },
)

function Input({
  className,
  type,
  density,
  intent,
  surface,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  const isDateLike = type === "date" || type === "month"

  return (
    <input
      type={type}
      data-slot="input"
      data-density={density ?? "default"}
      data-intent={intent ?? "neutral"}
      data-surface={surface ?? "flat"}
      className={cn(
        inputVariants({ density, intent, surface }),
        isDateLike &&
          "pr-2 [appearance:textfield] [-webkit-appearance:textfield] [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:min-h-[1.25rem] [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4",
        className
      )}
      {...props}
    />
  )
}

export { Input }
