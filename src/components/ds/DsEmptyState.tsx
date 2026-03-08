import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsEmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional icon rendered above the title. Pass a Lucide icon element, e.g. `<BarChart3 className="size-5" />`. */
  icon?: React.ReactNode;
  /** Use "hero" for full-page empty states (centered, flex-1). Default "inline" is compact. */
  variant?: "inline" | "hero";
  className?: string;
}

export function DsEmptyState({
  title,
  description,
  actions,
  icon,
  variant = "inline",
  className,
}: DsEmptyStateProps) {
  if (variant === "hero") {
    return (
      <div
        className={cn(
          "text-center text-muted-foreground py-10 px-4 flex flex-1 flex-col items-center justify-center gap-2.5",
          className,
        )}
      >
        {icon ? <div className="text-muted-foreground/50">{icon}</div> : null}
        <p className="text-sm font-medium text-foreground/80 ds-body-sm">{title}</p>
        {description ? <p className="text-xs ds-caption">{description}</p> : null}
        {actions ? <div className="flex flex-wrap gap-2 justify-center mt-2">{actions}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border/60 px-4 py-8 min-h-[160px] flex flex-col items-center justify-center text-center text-muted-foreground",
        className,
      )}
    >
      {icon ? <div className="mb-3 flex justify-center text-muted-foreground/40 [&>svg]:size-10">{icon}</div> : null}
      <p className="text-xs ds-caption">{title}</p>
      {description ? <p className="mt-1 text-xs ds-caption">{description}</p> : null}
      {actions ? <div className="flex flex-wrap gap-2 justify-center mt-2">{actions}</div> : null}
    </div>
  );
}

