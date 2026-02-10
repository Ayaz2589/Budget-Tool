import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card
      surface="flat"
      density="compact"
      className={cn("h-full rounded-2xl border border-border bg-card", className)}
    >
      <CardHeader className="px-4 pt-4 pb-1.5 md:px-5 md:pt-5 md:pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90 ds-label">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 md:px-5 md:pb-5 space-y-2">
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
      </CardContent>
    </Card>
  );
}
