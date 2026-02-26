import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CategoryOption } from "@/lib/format/categoryColors";
import type { ExpenseSource } from "@/types/core";
import type { FiltersAndActionsDialogProps } from "@/types/transactions";
import { EXPENSE_SOURCE_BADGE_LABELS, SOURCE_LABEL_KEYS } from "@/lib/format/sourceLabels";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { FiltersAndActionsDialogProps };

export function FiltersAndActionsDialog({
  open,
  onOpenChange,
  monthFilter,
  onMonthFilterChange,
  sourceFilter,
  onSourceFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  typeFilter,
  onTypeFilterChange,
  includeOwnerTransfersInTotals,
  onIncludeOwnerTransfersInTotalsChange,
  searchFilter,
  onSearchFilterChange,
  expenseCategories,
  ownerOptions = [],
  cardSources,
  hasActiveFilters,
  onClearFilters,
  t,
}: FiltersAndActionsDialogProps) {
  const sheetSide = "right";
  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  const handleCancel = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
        desktopVariant="modal"
        showCloseButton={true}
        data-tour="transactions-filters-sheet"
       
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl flex flex-col"
      >
        <DsSheetHeader
          title={t("transactions.filtersActionsTitle")}
          description={t("transactions.filtersActionsDesc")}
          helpContent={t("transactions.help.filtersSheet")}
          helpLabel={t("common.help")}
        />
        <div className="grid gap-6 px-4 pt-4 pb-8 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {/* Filters */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t("common.filters")}</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={onClearFilters}
                  className="h-9 px-3 shrink-0"
                >
                  {t("common.clearFilters")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t("transactions.month")}
                </Label>
                <MonthYearPicker
                  value={monthFilter}
                  onChange={onMonthFilterChange}
                  triggerLabel={monthFilter || "YYYY-MM"}
                  placeholder="YYYY-MM"
                  triggerClassName={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Source</Label>
                <Select
                  value={sourceFilter}
                  onValueChange={onSourceFilterChange}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="all" value="all">
                      {t(SOURCE_LABEL_KEYS.all)}
                    </SelectItem>
                    {cardSources.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                            {EXPENSE_SOURCE_BADGE_LABELS[s as ExpenseSource]}
                          </span>
                          {t(SOURCE_LABEL_KEYS[s as ExpenseSource])}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t("common.category")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`${selectTriggerClass} flex items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs`}
                    >
                      <span className="truncate text-left">
                        {categoryFilter.length === 0
                          ? t("common.all")
                          : categoryFilter.length === 1
                            ? (categoryFilter[0] === "__uncategorized"
                                ? t("common.uncategorized")
                                : categoryFilter[0])
                            : `${categoryFilter.length} ${t("common.selected")}`}
                      </span>
                      <svg className="size-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 max-h-64 overflow-y-auto" align="start">
                    <label className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent">
                      <Checkbox
                        checked={categoryFilter.includes("__uncategorized")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onCategoryFilterChange([...categoryFilter, "__uncategorized"]);
                          } else {
                            onCategoryFilterChange(categoryFilter.filter((c) => c !== "__uncategorized"));
                          }
                        }}
                      />
                      <CategoryOption name={t("common.uncategorized")} type="expense" />
                    </label>
                    {expenseCategories.map((c) => (
                      <label key={c} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent">
                        <Checkbox
                          checked={categoryFilter.includes(c)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onCategoryFilterChange([...categoryFilter, c]);
                            } else {
                              onCategoryFilterChange(categoryFilter.filter((v) => v !== c));
                            }
                          }}
                        />
                        <CategoryOption name={c} type="expense" />
                      </label>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t("common.owner")}
                </Label>
                <Select
                  value={ownerFilter}
                  onValueChange={onOwnerFilterChange}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder={t("common.all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                    {ownerOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t("transactions.type")}
                </Label>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("transactions.typeAll")}</SelectItem>
                    <SelectItem value="expense">{t("transactions.typeExpense")}</SelectItem>
                    <SelectItem value="transfer">{t("transactions.typeTransfer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t("transactions.totalsLabel")}
                </Label>
                <label className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--field-surface)] px-3 py-2 min-h-[44px] text-sm">
                  <Checkbox
                    checked={includeOwnerTransfersInTotals}
                    onCheckedChange={(checked) =>
                      onIncludeOwnerTransfersInTotalsChange(checked === true)
                    }
                  />
                  <span>{t("transactions.includeOwnerTransfersInTableTotals")}</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  {t("transactions.tableTotalsDefinitionHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t("transactions.searchDescription")}
                </Label>
                <Input
                  placeholder={t("transactions.filterByDescription")}
                  value={searchFilter}
                  onChange={(e) => onSearchFilterChange(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

        </div>
        <DsSheetActions className="py-3">
          <Button
            type="button"
            variant="outline"
            density="compact"
            onClick={handleCancel}
            className="w-full"
          >
            {t("common.cancel")}
          </Button>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}
