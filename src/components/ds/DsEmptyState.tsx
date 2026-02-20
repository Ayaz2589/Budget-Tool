import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsEmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DsEmptyState({
  title,
  description,
  icon,
  actions,
  className,
}: DsEmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center text-muted-foreground py-10 px-4 flex flex-1 flex-col items-center justify-center gap-2.5",
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground/70">{icon}</div> : null}
      <p className="text-sm font-medium text-foreground/80 ds-body-sm">{title}</p>
      {description ? <p className="text-xs ds-caption">{description}</p> : null}
      {actions ? <div className="flex flex-wrap gap-2 justify-center mt-2">{actions}</div> : null}
    </div>
  );
}

