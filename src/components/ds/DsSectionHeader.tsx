import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsSectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function DsSectionHeader({
  title,
  subtitle,
  actions,
  className,
  titleClassName,
  subtitleClassName,
}: DsSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-2 md:gap-3",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className={cn("text-xl md:text-2xl font-semibold ds-heading-2", titleClassName)}>
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("text-xs md:text-sm text-muted-foreground ds-body-sm", subtitleClassName)}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

