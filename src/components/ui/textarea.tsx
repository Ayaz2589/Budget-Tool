import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground text-[var(--text-primary)] w-full min-w-0 rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--field-surface)] px-3 py-2 text-base md:text-sm shadow-[var(--field-shadow)] transition-[background-color,border-color,box-shadow,color] outline-none min-h-[80px] resize-y enabled:hover:bg-[var(--control-hover)] enabled:hover:border-[var(--border-strong)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-[var(--focus-ring)] focus-visible:ring-[var(--focus-ring)]/45 focus-visible:ring-[3px] aria-invalid:ring-destructive/25 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
