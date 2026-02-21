import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsMetricCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
}

export function DsMetricCard({
  title,
  value,
  subtitle,
  tone = "neutral",
  className,
}: DsMetricCardProps) {
  return (
    <div className={cn("h-full space-y-2", className)}>
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90 ds-label">
        {title}
      </h3>
      <p
        className={cn(
          "text-3xl font-semibold leading-tight tracking-tight ds-heading-3",
          tone === "positive" && "text-emerald-500",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </p>
      {subtitle ? (
        <p className="text-sm text-muted-foreground ds-caption">{subtitle}</p>
      ) : null}
    </div>
  );
}
