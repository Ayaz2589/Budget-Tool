import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tableDensityVariants = cva("", {
  variants: {
    density: {
      compact:
        "[&_[data-slot=table-head]]:h-10 [&_[data-slot=table-head]]:px-3 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-cell]]:px-3 [&_[data-slot=table-cell]]:py-2.5",
      default:
        "[&_[data-slot=table-head]]:h-11 [&_[data-slot=table-head]]:px-3 [&_[data-slot=table-cell]]:px-3 [&_[data-slot=table-cell]]:py-3",
      comfortable:
        "[&_[data-slot=table-head]]:h-12 [&_[data-slot=table-head]]:px-4 [&_[data-slot=table-head]]:text-sm [&_[data-slot=table-cell]]:px-4 [&_[data-slot=table-cell]]:py-3.5",
    },
  },
  defaultVariants: {
    density: "default",
  },
})

function Table({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"table"> & VariantProps<typeof tableDensityVariants>) {
  return (
    <div
      data-slot="table-container"
      data-density={density}
      className="relative w-full overflow-x-auto rounded-xl border border-[var(--control-border)] bg-[var(--surface-1)]"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm",
          tableDensityVariants({ density }),
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-[var(--border-subtle)]", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-[var(--control-surface)] border-t border-[var(--border-subtle)] font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-[var(--border-subtle)] transition-colors min-h-[44px] hover:bg-[var(--control-hover)] data-[state=selected]:bg-[var(--control-active)]",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "bg-[var(--control-surface)] text-[var(--text-secondary)] text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] ds-label",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "align-middle whitespace-nowrap text-[var(--text-primary)] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
