import { useCallback, useMemo } from "react";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import { DsWidgetShell } from "@/components/ds/DsWidgetShell";
import { DsEmptyState } from "@/components/ds";
import { useTranslation } from "react-i18next";
import type { WidgetSize, WidgetType } from "@/types/widget";

interface DashboardMobileGridProps {
  dashboardData: Record<string, unknown>;
}

export function DashboardMobileGrid({ dashboardData }: DashboardMobileGridProps) {
  const { layout, isEditing, updateMobileOrder, resizeWidget, hideWidget } =
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
      {visibleIds.map((id, index) => {
        const registry = WIDGET_REGISTRY[id];
        if (!registry) return null;
        const size = sizeMap.get(id) ?? "md";

        return (
          <div key={id}>
            <DsWidgetShell
              widgetType={id}
              size={size}
              isEditing={isEditing}
              isMobile
              isFirst={index === 0}
              isLast={index === visibleIds.length - 1}
              onResize={(s) => resizeWidget(id, s)}
              onHide={() => hideWidget(id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            >
              {registry.render(dashboardData, size)}
            </DsWidgetShell>
          </div>
        );
      })}
    </div>
  );
}
