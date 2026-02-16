import { useTranslation } from "react-i18next";
import { Reorder } from "framer-motion";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DsHelpTooltip, DsSplitToggle } from "@/components/ds";
import type { FinancialViewMode } from "@/lib/financialModel";
import type { DashboardExpenseScope, DashboardRange } from "@/types/dashboard";
import {
  type DashboardWidgetConfig,
  type WidgetId,
  DEFAULT_CONFIG,
  WIDGET_REGISTRY,
} from "@/pages/dashboard/dashboardWidgets";

function formatMonthKeyNumeric(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  if (!year || !month) return monthKey;
  return `${month}/${year}`;
}

interface DashboardFiltersProps {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  viewMode: FinancialViewMode;
  setViewMode: (mode: FinancialViewMode) => void;
  selectedOwner: string;
  setSelectedOwner: (owner: string) => void;
  ownerOptions: string[];
  selectedMonthKey: string;
  setSelectedMonthKey: (key: string) => void;
  availableMonthKeys: string[];
  range: DashboardRange;
  setRange: (range: DashboardRange) => void;
  expenseScope: DashboardExpenseScope;
  setExpenseScope: (scope: DashboardExpenseScope) => void;
  includeDebtPayments: boolean;
  setIncludeDebtPayments: (include: boolean) => void;
  widgetConfig: DashboardWidgetConfig;
  onWidgetConfigChange: (config: DashboardWidgetConfig) => void;
}

export function DashboardFilters({
  settingsOpen,
  setSettingsOpen,
  viewMode,
  setViewMode,
  selectedOwner,
  setSelectedOwner,
  ownerOptions,
  selectedMonthKey,
  setSelectedMonthKey,
  availableMonthKeys,
  range,
  setRange,
  expenseScope,
  setExpenseScope,
  includeDebtPayments,
  setIncludeDebtPayments,
  widgetConfig,
  onWidgetConfigChange,
}: DashboardFiltersProps) {
  const { t } = useTranslation();

  const handleReorder = (newOrder: WidgetId[]) => {
    onWidgetConfigChange({ ...widgetConfig, order: newOrder });
  };

  const handleToggle = (id: WidgetId, visible: boolean) => {
    const hidden = visible
      ? widgetConfig.hidden.filter((h) => h !== id)
      : [...widgetConfig.hidden, id];
    onWidgetConfigChange({ ...widgetConfig, hidden });
  };

  const handleReset = () => {
    onWidgetConfigChange(DEFAULT_CONFIG);
  };

  return (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent
        side="right"
        data-tour="dashboard-settings-sheet"
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl flex flex-col"
      >
        <SheetHeader className="px-4 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <SheetTitle className="font-semibold text-left pr-10 break-words text-xl leading-snug ds-heading-3">
            <span className="inline-flex items-center gap-2">
              {t("settings.title")}
              <DsHelpTooltip
                asChildSpan
                content={t("dashboard.help.settingsSheet")}
                ariaLabel={t("common.help")}
                className="size-6 text-muted-foreground"
              />
            </span>
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm text-left ds-body-sm">
            {t("dashboard.healthQuestion")}
          </SheetDescription>
        </SheetHeader>
        <div className="grid content-start gap-4 px-4 pt-4 pb-8 overflow-y-auto overscroll-contain flex-1 min-h-0">
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t("dashboard.viewMode")}</Label>
            <DsSplitToggle
              className="w-full"
              options={[
                { value: "household", label: t("dashboard.viewHousehold") },
                { value: "individual", label: t("dashboard.viewIndividual") },
              ]}
              value={viewMode}
              onChange={(next) => setViewMode(next as FinancialViewMode)}
            />
          </div>
          {viewMode === "individual" ? (
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("common.owner")}</Label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
                  <SelectValue placeholder={t("common.noOwner")} />
                </SelectTrigger>
                <SelectContent>
                  {ownerOptions.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t("common.month")}</Label>
            <Select
              value={selectedMonthKey}
              onValueChange={setSelectedMonthKey}
            >
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonthKeys.map((monthKey) => (
                  <SelectItem key={monthKey} value={monthKey}>
                    {formatMonthKeyNumeric(monthKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t("dashboard.timeRange")}</Label>
            <DsSplitToggle
              className="w-full"
              options={[
                { value: "current", label: t("dashboard.rangeCurrent") },
                { value: "6", label: t("dashboard.range6") },
                { value: "12", label: t("dashboard.range12") },
              ]}
              value={range}
              onChange={(next) => setRange(next as DashboardRange)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t("common.totalSpent")}</Label>
            <DsSplitToggle
              className="w-full"
              options={[
                { value: "all", label: t("dashboard.scopeAllExpenses") },
                { value: "exclude-mortgage", label: t("dashboard.scopeExcludeMortgage") },
              ]}
              value={expenseScope}
              onChange={(next) => setExpenseScope(next as DashboardExpenseScope)}
            />
            {expenseScope === "exclude-mortgage" ? (
              <p className="text-xs text-muted-foreground">
                {t("dashboard.scopeMortgageExcludedHint")}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t("dashboard.chartDebtPayments")}</Label>
            <DsSplitToggle
              className="w-full"
              options={[
                { value: "include", label: t("dashboard.includeDebtPayments") },
                { value: "exclude", label: t("dashboard.excludeDebtPayments") },
              ]}
              value={includeDebtPayments ? "include" : "exclude"}
              onChange={(next) => setIncludeDebtPayments(next === "include")}
            />
            {!includeDebtPayments ? (
              <p className="text-xs text-muted-foreground">
                {t("dashboard.debtPaymentsExcludedHint")}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">{t("dashboard.widgetsSection")}</Label>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={handleReset}
              >
                {t("dashboard.resetWidgets")}
              </Button>
            </div>
            <Reorder.Group
              axis="y"
              values={widgetConfig.order}
              onReorder={handleReorder}
              className="space-y-1"
            >
              {widgetConfig.order.map((id) => {
                const meta = WIDGET_REGISTRY.find((w) => w.id === id);
                if (!meta) return null;
                const isVisible = !widgetConfig.hidden.includes(id);
                return (
                  <Reorder.Item
                    key={id}
                    value={id}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 select-none"
                  >
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    <span className="flex-1 text-sm truncate">{t(meta.labelKey)}</span>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(checked) => handleToggle(id, !!checked)}
                    />
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={() => setSettingsOpen(false)}
          >
            {t("common.done")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
