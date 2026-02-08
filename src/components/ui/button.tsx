import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[var(--focus-ring)] focus-visible:ring-[var(--focus-ring)]/45 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)] hover:brightness-110",
        destructive:
          "bg-[var(--interactive-danger)] text-white hover:brightness-110 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      intent: {
        neutral: "",
        primary: "",
        danger: "",
        success:
          "data-[variant=default]:bg-emerald-600 data-[variant=default]:text-white data-[variant=default]:hover:bg-emerald-500",
      },
      density: {
        compact: "text-xs md:text-sm",
        default: "text-sm",
        comfortable: "text-sm md:text-base",
      },
      surface: {
        solid: "",
        flat: "shadow-none",
        raised: "shadow-sm",
      },
      size: {
        default: "h-11 min-h-[44px] px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 min-h-[44px] md:min-h-0 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 min-h-[44px] rounded-md px-6 has-[>svg]:px-4",
        icon: "size-11 min-h-[44px]",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      intent: "neutral",
      density: "default",
      surface: "solid",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  intent = "neutral",
  density = "default",
  surface = "solid",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-intent={intent ?? "neutral"}
      data-density={density ?? "default"}
      data-surface={surface ?? "solid"}
      data-size={size}
      className={cn(
        buttonVariants({ variant, intent, density, surface, size, className })
      )}
      {...props}
    />
  )
}

export { Button }
