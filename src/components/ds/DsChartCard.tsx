import type * as React from "react";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/lib/widgets/widget";

interface DsChartCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: WidgetSize;
  className?: string;
}

export function DsChartCard({ title, children, actions, className }: DsChartCardProps) {
  return (
    <section className={cn("min-w-0 space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">{title}</h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
