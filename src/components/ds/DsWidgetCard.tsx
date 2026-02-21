import type * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/types/widget";

const SIZE_PADDING: Record<WidgetSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-5 py-4",
};

const SIZE_DENSITY: Record<WidgetSize, "compact" | "default" | "comfortable"> = {
  sm: "compact",
  md: "default",
  lg: "comfortable",
};

interface DsWidgetCardProps {
  size: WidgetSize;
  children: React.ReactNode;
  className?: string;
}

export function DsWidgetCard({ size, children, className }: DsWidgetCardProps) {
  return (
    <Card
      surface="raised"
      density={SIZE_DENSITY[size]}
      className={cn(
        "h-full overflow-hidden rounded-2xl",
        SIZE_PADDING[size],
        className,
      )}
    >
      {children}
    </Card>
  );
}
