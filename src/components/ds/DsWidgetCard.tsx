import type * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/types/widget";

const SIZE_PADDING: Record<WidgetSize, string> = {
  sm: "px-3 py-2.5",
  wide: "px-3 py-2.5",
  md: "px-3 py-2",
  tall: "px-3 py-2",
  lg: "px-4 py-3",
  xl: "px-4 py-3",
};

const SIZE_DENSITY: Record<WidgetSize, "compact" | "default" | "comfortable"> = {
  sm: "compact",
  wide: "compact",
  md: "default",
  tall: "default",
  lg: "comfortable",
  xl: "comfortable",
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
        "h-full overflow-y-auto overflow-x-hidden rounded-2xl",
        SIZE_PADDING[size],
        className,
      )}
    >
      {children}
    </Card>
  );
}
