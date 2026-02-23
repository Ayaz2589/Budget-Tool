import { useCallback, useMemo, useRef, useState } from "react";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";
import { DsWidgetShell } from "@/components/ds/DsWidgetShell";
import { DsEmptyState } from "@/components/ds";
import { useTranslation } from "react-i18next";
import { useLongPress } from "@/hooks/useLongPress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetSize, WidgetType } from "@/lib/widgets/widget";

const SIZE_LABELS: Record<WidgetSize, string> = { sm: "S", md: "M", lg: "L" };
const ALL_SIZES: WidgetSize[] = ["sm", "md", "lg"];

interface DashboardMobileGridProps {
  dashboardData: Record<string, unknown>;
}

function MobileWidgetItem({
  id,
  index,
  isFirst,
  isLast,
  size,
  dashboardData,
  onMoveUp,
  onMoveDown,
  onResize,
  onHide,
}: {
  id: WidgetType;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  size: WidgetSize;
  dashboardData: Record<string, unknown>;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onResize: (id: WidgetType, size: WidgetSize) => void;
  onHide: (id: WidgetType) => void;
}) {
  const { t } = useTranslation();
  const registry = WIDGET_REGISTRY[id];
  const [popoverOpen, setPopoverOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const longPress = useLongPress(
    () => setPopoverOpen(true),
    { threshold: 500, moveThreshold: 10, haptic: true },
  );

  if (!registry) return null;

  return (
    <div key={id} ref={anchorRef} {...longPress}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div aria-hidden className="hidden" />
        </PopoverTrigger>
        <DsWidgetShell
          widgetType={id}
          size={size}
          isMobile
          onResize={(s) => onResize(id, s)}
          onHide={() => onHide(id)}
        >
          {registry.render(dashboardData, size)}
        </DsWidgetShell>
        <PopoverContent align="center" side="top" className="w-52 p-3">
          {/* Widget label */}
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {registry.icon}
            <span className="truncate">{t(registry.label)}</span>
          </div>

          {/* Move buttons */}
          <div className="mb-2 flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 gap-1.5 text-xs"
              disabled={isFirst}
              onClick={() => {
                onMoveUp(index);
                setPopoverOpen(false);
              }}
            >
              <ChevronUp className="size-3.5" />
              {t("widget.moveUp")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 gap-1.5 text-xs"
              disabled={isLast}
              onClick={() => {
                onMoveDown(index);
                setPopoverOpen(false);
              }}
            >
              <ChevronDown className="size-3.5" />
              {t("widget.moveDown")}
            </Button>
          </div>

          {/* Size selector */}
          <div className="mb-2 flex items-center rounded-md border border-border/60 bg-background">
            {ALL_SIZES.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onResize(id, s);
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

          {/* Hide button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              onHide(id);
              setPopoverOpen(false);
            }}
          >
            <EyeOff className="size-3.5" />
            {t("widget.hide")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DashboardMobileGrid({ dashboardData }: DashboardMobileGridProps) {
  const { layout, updateMobileOrder, resizeWidget, hideWidget } =
    useDashboardLayout();
  const { t } = useTranslation();

  const visibleIds = useMemo(() => {
    const visibleSet = new Set(
      layout.desktopGrid.filter((item) => item.visible).map((item) => item.id),
    );
    return layout.mobileOrder.filter((id) => visibleSet.has(id));
  }, [layout.desktopGrid, layout.mobileOrder]);

  const sizeMap = useMemo(() => {
    const map = new Map<WidgetType, WidgetSize>();
    for (const item of layout.desktopGrid) {
      map.set(item.id, item.size);
    }
    return map;
  }, [layout.desktopGrid]);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...visibleIds];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      updateMobileOrder(next);
    },
    [visibleIds, updateMobileOrder],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= visibleIds.length - 1) return;
      const next = [...visibleIds];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      updateMobileOrder(next);
    },
    [visibleIds, updateMobileOrder],
  );

  if (visibleIds.length === 0) {
    return <DsEmptyState title={t("widget.noWidgetsVisible")} className="py-12" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleIds.map((id, index) => (
        <MobileWidgetItem
          key={id}
          id={id}
          index={index}
          isFirst={index === 0}
          isLast={index === visibleIds.length - 1}
          size={sizeMap.get(id) ?? "md"}
          dashboardData={dashboardData}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onResize={resizeWidget}
          onHide={hideWidget}
        />
      ))}
    </div>
  );
}
