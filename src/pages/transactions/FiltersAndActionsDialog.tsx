import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SourceIcon } from "@/components/cards";
import { CategoryOption } from "@/lib/categoryColors";
import type { ExpenseSource } from "@/types/core";
import type { FiltersAndActionsDialogProps } from "@/types/transactions";
import { SOURCE_LABEL_KEYS } from "@/lib/sourceLabels";
import { FileDown, Trash2 } from "lucide-react";

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
  searchFilter,
  onSearchFilterChange,
  expenseCategories,
  ownerOptions = [],
  cardSources,
  hasActiveFilters,
  onClearFilters,
  onCleanDescriptions,
  onDownloadPdf,
  someSelected,
  selectedCount,
  onDeleteSelected,
  onClearSelection,
  expensesCount,
  onDeleteAll,
  t,
}: FiltersAndActionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="fixed bottom-0 left-0 right-0 top-auto z-50 w-full max-w-full max-h-[85vh] translate-x-0 translate-y-0 rounded-t-2xl border-t p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:max-h-[90vh] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:border md:max-w-2xl md:overflow-y-auto md:p-6"
      >
        <DialogHeader className="px-4 pt-4 pb-2 md:px-0 md:pt-0 md:pb-0">
          <DialogTitle>{t("transactions.filtersActionsTitle")}</DialogTitle>
          <DialogDescription>
            {t("transactions.filtersActionsDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 px-4 pb-8 overflow-y-auto overscroll-contain md:px-0 md:pb-0 md:overflow-visible">
          {/* Filters */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t("common.filters")}</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="shrink-0"
                >
                  {t("common.clearFilters")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t("transactions.month")}
                </Label>
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => onMonthFilterChange(e.target.value)}
                  className="w-full min-w-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Source</Label>
                <Select
                  value={sourceFilter}
                  onValueChange={onSourceFilterChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="all" value="all">
                      {t(SOURCE_LABEL_KEYS.all)}
                    </SelectItem>
                    {cardSources.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <SourceIcon source={s as ExpenseSource} size={18} />
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
                  <SelectTrigger className="w-full">
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
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label className="text-muted-foreground">
                  {t("common.owner")}
                </Label>
                <Select
                  value={ownerFilter}
                  onValueChange={onOwnerFilterChange}
                >
                  <SelectTrigger className="w-full">
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
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label className="text-muted-foreground">
                  {t("transactions.searchDescription")}
                </Label>
                <Input
                  placeholder={t("transactions.filterByDescription")}
                  value={searchFilter}
                  onChange={(e) => onSearchFilterChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold">{t("common.actions")}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCleanDescriptions}
                className="justify-start"
              >
                {t("transactions.cleanDescriptions")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadPdf}
                className="justify-start"
              >
                <FileDown className="size-4" />
                {t("transactions.downloadPdf")}
              </Button>
              {someSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="justify-start"
                >
                  {t("common.clearSelection")}
                </Button>
              )}
            </div>

            {(someSelected || expensesCount > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {someSelected && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteSelected}
                  >
                    <Trash2 className="size-4" />
                    {t("transactions.deleteSelected", { count: selectedCount })}
                  </Button>
                )}
                {expensesCount > 0 && (
                  <Button variant="destructive" size="sm" onClick={onDeleteAll}>
                    <Trash2 className="size-4" />
                    {t("transactions.deleteAll")}
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
