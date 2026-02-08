import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsDataRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  meta?: React.ReactNode;
  ariaLabel?: string;
  onClick?: () => void;
  className?: string;
  dense?: boolean;
}

export function DsDataRow({
  title,
  subtitle,
  leading,
  trailing,
  meta,
  ariaLabel,
  onClick,
  className,
  dense = false,
}: DsDataRowProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "w-full text-left flex items-start gap-3 border-t border-[var(--border-subtle)]",
        dense ? "px-3 py-3.5 md:px-4 md:py-4" : "px-3 py-4 md:px-4 md:py-5",
        "transition-colors hover:bg-muted/30",
        className,
      )}
    >
      {leading ? <div className="shrink-0 pt-0.5">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-medium ds-body">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-muted-foreground ds-caption truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
          {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
        </div>
        {meta ? <div className="mt-2">{meta}</div> : null}
      </div>
    </Comp>
  );
}
