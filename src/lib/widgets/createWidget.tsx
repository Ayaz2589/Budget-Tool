import type { WidgetType, WidgetSize, SizeDims, WidgetRegistryEntry } from "@/lib/widgets/widget";
import type React from "react";

export interface CreateWidgetOptions {
  type: WidgetType;
  label: string;
  icon: React.ReactNode;
  sm: { w: number; h: number };
  md: { w: number; h: number };
  lg: { w: number; h: number };
  render: (props: Record<string, unknown>, size: WidgetSize) => React.ReactNode;
  defaultSize?: WidgetSize;
  className?: string;
}

export function createWidget(options: CreateWidgetOptions): WidgetRegistryEntry {
  const { type, label, icon, sm, md, lg, render, defaultSize = "md", className } = options;

  const sizeDims: SizeDims = { sm, md, lg };

  const wrappedRender = className
    ? (props: Record<string, unknown>, size: WidgetSize): React.ReactNode => (
        <div className={className}>{render(props, size)}</div>
      )
    : render;

  return {
    type,
    label,
    icon,
    defaultSize,
    sizeDims,
    render: wrappedRender,
  };
}
