import type * as React from "react";
import { cn } from "@/lib/utils";

export interface DsLegendListItem {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
  color: string;
}

interface DsLegendListProps {
  items: DsLegendListItem[];
  className?: string;
}

export function DsLegendList({ items, className }: DsLegendListProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {items.map((item) => (
        <div
          key={item.key}
          className="w-full flex items-center justify-between text-left text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

