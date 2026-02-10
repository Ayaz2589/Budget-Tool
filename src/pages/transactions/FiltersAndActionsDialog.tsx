import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryOption } from "@/lib/categoryColors";
import type { ExpenseSource } from "@/types/core";
import type { FiltersAndActionsDialogProps } from "@/types/transactions";
import { EXPENSE_SOURCE_BADGE_LABELS, SOURCE_LABEL_KEYS } from "@/lib/sourceLabels";
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
        showCloseButton={true}
       
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl flex flex-col"
      >
        <DsSheetHeader
          title={t("transactions.filtersActionsTitle")}
          description={t("transactions.filtersActionsDesc")}
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
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY-MM"
                  pattern="\d{4}-\d{2}"
                  maxLength={7}
                  value={monthFilter}
                  onChange={(e) => onMonthFilterChange(e.target.value)}
                  className={fieldClass}
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
                <Select
                  value={categoryFilter || "_"}
                  onValueChange={(v) =>
                    onCategoryFilterChange(v === "_" ? "" : v)
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder={t("common.all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">{t("common.all")}</SelectItem>
                    <SelectItem value="__uncategorized">
                      <CategoryOption
                        name={t("common.uncategorized")}
                        type="expense"
                      />
                    </SelectItem>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        <CategoryOption name={c} type="expense" />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            className="h-11 w-full"
          >
            {t("common.cancel")}
          </Button>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}
