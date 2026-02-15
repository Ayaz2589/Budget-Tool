import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
}: DashboardFiltersProps) {
  const { t } = useTranslation();

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
