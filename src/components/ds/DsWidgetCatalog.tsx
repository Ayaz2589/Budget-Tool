import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DsSheetHeader } from "@/components/ds/DsSheetHeader";
import { DsSheetActions } from "@/components/ds/DsSheetActions";
import { DsDataRow } from "@/components/ds/DsDataRow";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";
import { WIDGET_GROUPS } from "@/lib/widgets/widgetGroups";
import type { WidgetType } from "@/lib/widgets/widget";

interface DsWidgetCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleWidgetIds: Set<WidgetType>;
  onShow: (id: WidgetType) => void;
  onHide: (id: WidgetType) => void;
  onReset?: () => void;
}

export function DsWidgetCatalog({
  open,
  onOpenChange,
  visibleWidgetIds,
  onShow,
  onHide,
  onReset,
}: DsWidgetCatalogProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" desktopVariant="modal" desktopModalSize="compact" className="flex flex-col p-0 gap-0 w-80 sm:w-96 md:w-auto">
        <DsSheetHeader
          title={t("widget.manageWidgets")}
          description={t("widget.catalogDescription")}
        />
        <div className="flex-1 overflow-y-auto">
          {WIDGET_GROUPS.map((group) => (
            <div key={group.key}>
              <div className="sticky top-0 z-10 bg-[var(--surface-1)] px-4 py-2 border-b border-[var(--border-subtle)]">
                <span className="ds-label text-muted-foreground">{t(group.label)}</span>
              </div>
              {group.widgets.map((wType) => {
                const entry = WIDGET_REGISTRY[wType];
                if (!entry) return null;
                const isVisible = visibleWidgetIds.has(wType);

                return (
                  <DsDataRow
                    key={wType}
                    dense
                    leading={
                      <span className="text-muted-foreground">{entry.icon}</span>
                    }
                    title={t(entry.label)}
                    trailing={
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) =>
                          checked ? onShow(wType) : onHide(wType)
                        }
                        aria-label={t(entry.label)}
                      />
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
        {onReset && (
          <DsSheetActions>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onReset}
            >
              <RotateCcw className="size-4" />
              {t("widget.resetLayout")}
            </Button>
          </DsSheetActions>
        )}
      </SheetContent>
    </Sheet>
  );
}
