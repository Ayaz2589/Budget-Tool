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
      surface="raised"
      density="compact"
      className={cn("h-full", className)}
    >
      <CardHeader className="px-2.5 pt-2.5 pb-1 md:px-5 md:pt-5 md:pb-1.5">
        <CardTitle className="text-[11px] md:text-sm text-muted-foreground ds-label">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2.5 pb-2.5 md:px-5 md:pb-5 space-y-1">
        <p
          className={cn(
            "text-base md:text-2xl font-semibold tracking-tight ds-heading-3",
            tone === "positive" && "text-green-400",
            tone === "negative" && "text-destructive",
          )}
        >
          {value}
        </p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground ds-caption">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

