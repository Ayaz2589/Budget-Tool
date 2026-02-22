import type React from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import { DsWidgetCard } from "./DsWidgetCard";
import type { WidgetType, WidgetSize } from "@/types/widget";

const SIZE_LABELS: Record<WidgetSize, string> = { sm: "S", wide: "W", md: "M", tall: "T", lg: "L", xl: "XL" };

interface DsWidgetShellProps {
  widgetType: WidgetType;
  size: WidgetSize;
  isEditing: boolean;
  onResize?: (size: WidgetSize) => void;
  onHide?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isMobile?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
}

export function DsWidgetShell({
  widgetType,
  size,
  isEditing,
  onResize,
  onHide,
  onMoveUp,
  onMoveDown,
  isMobile,
  isFirst,
  isLast,
  children,
}: DsWidgetShellProps) {
  const { t } = useTranslation();
  const registry = WIDGET_REGISTRY[widgetType];
  const label = t(registry.label);

  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "h-full w-full overflow-hidden rounded-2xl",
        isEditing && "ring-2 ring-primary/20 bg-card shadow-sm",
      )}
    >
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-3 py-1.5"
          >
            {/* Drag handle (desktop) */}
            {!isMobile && (
              <GripVertical
                className="react-grid-dragHandleExample size-4 shrink-0 cursor-grab text-muted-foreground"
                aria-hidden
              />
            )}

            {/* Mobile move buttons */}
            {isMobile && (
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={isFirst}
                  onClick={onMoveUp}
                  aria-label={t("widget.moveUp")}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={isLast}
                  onClick={onMoveDown}
                  aria-label={t("widget.moveDown")}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </div>
            )}

            {/* Widget label */}
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate">
              {registry.icon}
              {label}
            </span>

            <div className="ml-auto flex items-center gap-1">
              {/* Size selector */}
              {onResize && (
                <div className="flex items-center rounded-md border border-border/60 bg-background">
                  {registry.allowedSizes.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onResize(s)}
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] font-semibold leading-none transition-colors",
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
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={onHide}
                  aria-label={t("widget.hide")}
                >
                  <EyeOff className="size-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DsWidgetCard size={size}>{children}</DsWidgetCard>
    </div>
  );
}
