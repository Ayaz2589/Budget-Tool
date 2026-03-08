import { useState } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, EyeOff, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";
import { DsWidgetCard } from "./DsWidgetCard";
import type { WidgetType, WidgetSize } from "@/lib/widgets/widget";

const SIZE_LABELS: Record<WidgetSize, string> = { sm: "S", md: "M", lg: "L" };
const ALL_SIZES: WidgetSize[] = ["sm", "md", "lg"];

interface DsWidgetShellProps {
  widgetType: WidgetType;
  size: WidgetSize;
  onResize?: (size: WidgetSize) => void;
  onHide?: () => void;
  isMobile?: boolean;
  children: React.ReactNode;
}

export function DsWidgetShell({
  widgetType,
  size,
  onResize,
  onHide,
  isMobile,
  children,
}: DsWidgetShellProps) {
  const { t } = useTranslation();
  const registry = WIDGET_REGISTRY[widgetType];
  const label = t(registry.label);
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="group relative h-full w-full overflow-hidden rounded-2xl"
    >
      {/* Controls — bottom-right, always visible on desktop */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
        {/* Drag handle — hidden on mobile */}
        {!isMobile && (
          <div
            className="react-grid-dragHandleExample flex size-6 cursor-grab items-center justify-center rounded-md bg-background/80 shadow-sm backdrop-blur-sm"
            aria-hidden
          >
            <GripVertical className="size-3.5 text-muted-foreground" />
          </div>
        )}

        {/* Overflow popover trigger */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-6 rounded-md bg-background/80 p-0 shadow-sm backdrop-blur-sm"
              aria-label={t("widget.resize")}
            >
              <MoreHorizontal className="size-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-3">
            {/* Widget label */}
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {registry.icon}
              <span className="truncate">{label}</span>
            </div>

            {/* Size selector */}
            {onResize && (
              <div className="mb-2 flex items-center rounded-md border border-border/60 bg-background">
                {ALL_SIZES.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onResize(s);
                      setPopoverOpen(false);
                    }}
                    className={cn(
                      "flex-1 px-1.5 py-1 text-[10px] font-semibold leading-none transition-colors",
                      s === size
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      i !== 0 && "border-l border-border/60",
                    )}
                    aria-label={`${t("widget.resize")} ${SIZE_LABELS[s]}`}
                    aria-pressed={s === size}
                  >
                    {SIZE_LABELS[s]}
                  </button>
                ))}
              </div>
            )}

            {/* Hide button */}
            {onHide && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onHide();
                  setPopoverOpen(false);
                }}
              >
                <EyeOff className="size-3.5" />
                {t("widget.hide")}
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <DsWidgetCard size={size}>{children}</DsWidgetCard>
    </div>
  );
}
