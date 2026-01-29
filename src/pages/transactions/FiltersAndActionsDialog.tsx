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
import { CategoryOption } from "@/lib/categoryColors";
import type { ExpenseSource } from "@/lib/types";
import { Plus, FileDown } from "lucide-react";

const SOURCES = ["all", "amex", "chase", "apple", "manual", "td"] as const;

export const SOURCE_LABEL_KEYS: Record<ExpenseSource | "all", string> = {
  all: "common.all",
  amex: "transactions.sourceAmex",
  chase: "transactions.sourceChase",
  apple: "transactions.sourceApple",
  manual: "transactions.sourceManual",
  td: "transactions.sourceTd",
};

export type FiltersAndActionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  cardMemberFilter: string;
  onCardMemberFilterChange: (value: string) => void;
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  expenseCategories: string[];
  cardMemberOptions: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAddTransaction: () => void;
  onReapplyRules: () => void;
  uncategorizedCount: number;
  onCleanDescriptions: () => void;
  onDownloadPdf: () => void;
  filteredCount: number;
  allFilteredSelected: boolean;
  onSelectAllFiltered: () => void;
  someSelected: boolean;
  selectedCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  expensesCount: number;
  onDeleteAll: () => void;
  t: (key: string, opts?: { count?: number }) => string;
};

export function FiltersAndActionsDialog({
  open,
  onOpenChange,
  monthFilter,
  onMonthFilterChange,
  sourceFilter,
  onSourceFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  cardMemberFilter,
  onCardMemberFilterChange,
  searchFilter,
  onSearchFilterChange,
  expenseCategories,
  cardMemberOptions,
  hasActiveFilters,
  onClearFilters,
  onAddTransaction,
  onReapplyRules,
  uncategorizedCount,
  onCleanDescriptions,
  onDownloadPdf,
  filteredCount,
  allFilteredSelected,
  onSelectAllFiltered,
  someSelected,
  selectedCount,
  onDeleteSelected,
  onClearSelection,
  expensesCount,
  onDeleteAll,
  t,
}: FiltersAndActionsDialogProps) {
  const handleAddTransaction = () => {
    onOpenChange(false);
    onAddTransaction();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("transactions.filtersActionsTitle")}</DialogTitle>
          <DialogDescription>
            {t("transactions.filtersActionsDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div>
            <h3 className="text-sm font-medium mb-3">{t("common.filters")}</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>{t("transactions.month")}</Label>
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => onMonthFilterChange(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={sourceFilter}
                  onValueChange={onSourceFilterChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(SOURCE_LABEL_KEYS[s])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("common.category")}</Label>
                <Select
                  value={categoryFilter || "_"}
                  onValueChange={(v) =>
                    onCategoryFilterChange(v === "_" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-[200px]">
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
                <Label>{t("common.cardMember")}</Label>
                <Select
                  value={cardMemberFilter}
                  onValueChange={onCardMemberFilterChange}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t("common.all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {cardMemberOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("transactions.searchDescription")}</Label>
                <Input
                  placeholder={t("transactions.filterByDescription")}
                  value={searchFilter}
                  onChange={(e) => onSearchFilterChange(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  {t("common.clearFilters")}
                </Button>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3">{t("common.actions")}</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAddTransaction}>
                <Plus className="size-4" />
                {t("transactions.addTransaction")}
              </Button>
              {uncategorizedCount > 0 && (
                <Button variant="outline" onClick={onReapplyRules}>
                  {t("transactions.reapplyRules", {
                    count: uncategorizedCount,
                  })}
                </Button>
              )}
              <Button variant="outline" onClick={onCleanDescriptions}>
                {t("transactions.cleanDescriptions")}
              </Button>
              <Button variant="outline" onClick={onDownloadPdf}>
                <FileDown className="size-4" />
                {t("transactions.downloadPdf")}
              </Button>
              {filteredCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectAllFiltered}
                >
                  {allFilteredSelected
                    ? t("common.deselectAll")
                    : t("common.selectAll")}
                </Button>
              )}
              {someSelected && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteSelected}
                  >
                    {t("transactions.deleteSelected", { count: selectedCount })}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClearSelection}>
                    {t("common.clearSelection")}
                  </Button>
                </>
              )}
              {expensesCount > 0 && (
                <Button variant="destructive" size="sm" onClick={onDeleteAll}>
                  {t("transactions.deleteAll")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
