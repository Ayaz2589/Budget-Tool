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
    <section className={cn("flex min-w-0 flex-col h-full", className)}>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-base font-semibold ds-heading-4">{title}</h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-2 flex-1 min-h-0">{children}</div>
    </section>
  );
}
