import type * as React from "react";
import { cn } from "@/lib/utils";

interface DsMetricCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  sparkline?: React.ReactNode;
  /** When true, pushes sparkline to the bottom of the card (use for larger sizes). */
  sparklineBottom?: boolean;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
}

export function DsMetricCard({
  title,
  value,
  subtitle,
  sparkline,
  sparklineBottom,
  tone = "neutral",
  className,
}: DsMetricCardProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90 ds-label">
          {title}
        </h3>
        <p
          className={cn(
            "text-3xl font-semibold leading-tight tracking-tight truncate ds-heading-3",
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
      {sparkline ? <div className={cn("-mb-3", sparklineBottom ? "mt-4" : "mt-2")}>{sparkline}</div> : null}
    </div>
  );
}
