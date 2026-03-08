import type * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/lib/widgets/widget";

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
        "flex h-full flex-col overflow-y-auto overflow-x-hidden rounded-2xl p-4",
        className,
      )}
    >
      {children}
    </Card>
  );
}
