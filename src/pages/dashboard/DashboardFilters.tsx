import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
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
import type { FinancialViewMode } from "@/lib/domain/financialModel";
import type { DashboardExpenseScope, DashboardRange } from "@/types/dashboard";

function formatMonthKeyNumeric(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  if (!year || !month) return monthKey;
  return `${month}/${year}`;
}

/** A settings row: label + description on the left, control on the right. */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-snug">{label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

/** Inline radio-style selector for 2-3 options — compact, no full-width toggle. */
function InlineOptions({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
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
        desktopVariant="modal"
        desktopModalSize="compact"
        data-tour="dashboard-settings-sheet"
        className="h-full w-[85vw] max-w-sm p-0 gap-0 flex flex-col md:w-auto md:h-auto md:max-w-lg"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/40">
          <SheetTitle className="flex items-center gap-2.5 text-left text-base font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
            </div>
            {t("settings.title")}
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-5 py-2">
          {/* Period */}
          <div className="divide-y divide-border/30">
            <SettingRow
              label={t("common.month")}
              description={t("dashboard.help.month", { defaultValue: "Select the month to display data for." })}
            >
              <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
                <SelectTrigger className="h-8 w-[100px] text-xs data-[size=default]:h-8">
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
            </SettingRow>

            <SettingRow
              label={t("dashboard.timeRange")}
              description={t("dashboard.help.timeRange", { defaultValue: "How many months of history to show in charts." })}
            >
              <InlineOptions
                options={[
                  { value: "current", label: t("dashboard.rangeCurrent") },
                  { value: "6", label: t("dashboard.range6") },
                  { value: "12", label: t("dashboard.range12") },
                ]}
                value={range}
                onChange={(next) => setRange(next as DashboardRange)}
              />
            </SettingRow>
          </div>

          <hr className="border-border/30 my-1" />

          {/* View */}
          <div className="divide-y divide-border/30">
            <SettingRow
              label={t("dashboard.viewIndividual")}
              description={t("dashboard.help.viewMode", { defaultValue: "View spending for a single owner instead of the whole household." })}
            >
              <Switch
                checked={viewMode === "individual"}
                onCheckedChange={(checked) =>
                  setViewMode(checked ? "individual" : "household")
                }
              />
            </SettingRow>

            {viewMode === "individual" && (
              <SettingRow
                label={t("common.owner")}
                description={t("dashboard.help.owner", { defaultValue: "Which owner's data to display." })}
              >
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger className="h-8 w-[120px] text-xs data-[size=default]:h-8">
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
              </SettingRow>
            )}
          </div>

          <hr className="border-border/30 my-1" />

          {/* Calculations */}
          <div className="divide-y divide-border/30">
            <SettingRow
              label={t("dashboard.scopeExcludeMortgage")}
              description={t("dashboard.help.excludeMortgage", { defaultValue: "Remove mortgage payments from spending totals for a clearer picture of discretionary spending." })}
            >
              <Switch
                checked={expenseScope === "exclude-mortgage"}
                onCheckedChange={(checked) =>
                  setExpenseScope(checked ? "exclude-mortgage" : "all")
                }
              />
            </SettingRow>

            <SettingRow
              label={t("dashboard.includeDebtPayments")}
              description={t("dashboard.help.includeDebt", { defaultValue: "Include debt payments in expense totals and cash flow calculations." })}
            >
              <Switch
                checked={includeDebtPayments}
                onCheckedChange={setIncludeDebtPayments}
              />
            </SettingRow>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center border-t border-border/40 px-5 py-4">
          <Button
            type="button"
            size="sm"
            className="px-12"
            onClick={() => setSettingsOpen(false)}
          >
            {t("common.done")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
