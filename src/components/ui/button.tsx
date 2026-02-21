import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-medium w-56 text-[var(--text-primary)] transition-[background-color,border-color,color,box-shadow,transform] active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[var(--focus-ring)] focus-visible:ring-[var(--focus-ring)]/45 focus-visible:ring-[3px] aria-invalid:ring-destructive/25 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)] hover:bg-[var(--interactive-primary-hover)] active:bg-[var(--interactive-primary-active)]",
        destructive:
          "bg-[var(--interactive-danger)] text-white hover:bg-[var(--interactive-danger-hover)] active:bg-[var(--interactive-danger-active)] focus-visible:ring-destructive/25",
        outline:
          "border-[var(--control-border)] bg-[var(--control-surface)] text-[var(--text-primary)] hover:bg-[var(--control-hover)] hover:border-[var(--border-strong)] active:bg-[var(--control-active)]",
        secondary:
          "bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--control-hover)] active:bg-[var(--control-active)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)] active:bg-[var(--control-active)]",
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
        raised: "shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-12 px-6 py-2.5 has-[>svg]:px-5",
        xs: "h-12 gap-1 px-5 text-xs has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-12 gap-1.5 px-5 has-[>svg]:px-4",
        lg: "h-12 px-7 has-[>svg]:px-6",
        icon: "size-12 w-12",
        "icon-xs": "size-12 w-12 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-12 w-12",
        "icon-lg": "size-12 w-12",
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
