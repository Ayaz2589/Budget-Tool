import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsEmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function DsEmptyState({
  title,
  description,
  icon,
  className,
}: DsEmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center text-muted-foreground py-10 px-4 flex flex-col items-center gap-2.5",
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground/70">{icon}</div> : null}
      <p className="text-sm font-medium text-foreground/80 ds-body-sm">{title}</p>
      {description ? <p className="text-xs ds-caption">{description}</p> : null}
    </div>
  );
}

