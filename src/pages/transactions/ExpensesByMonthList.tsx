import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceIcon } from "@/components/cards";
import { formatCurrency } from "@/lib/format";
import { getMonthLabel } from "@/lib/totals";
import type { Expense } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ExpensesByMonthListProps = {
  byMonth: [string, Expense[]][];
  defaultOpenMonth: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleMonthSelection: (monthExpenses: Expense[]) => void;
  onExpenseTap: (expense: Expense) => void;
  t: (key: string, opts?: { count?: number }) => string;
};

export function ExpensesByMonthList({
  byMonth,
  defaultOpenMonth,
  selectedIds,
  onToggleSelect,
  onToggleMonthSelection: _onToggleMonthSelection,
  onExpenseTap,
  t,
}: ExpensesByMonthListProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpenMonth}
      className="divide-y"
    >
      {byMonth.map(([monthKey, monthExpenses]) => (
        <AccordionItem key={monthKey} value={monthKey} className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            <span className="font-semibold">{getMonthLabel(monthKey)}</span>
            <span className="text-muted-foreground font-normal ml-2">
              (
              {monthExpenses.length === 1
                ? t("transactions.transaction_one", { count: 1 })
                : t("transactions.transaction_other", {
                    count: monthExpenses.length,
                  })}
              )
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="divide-y border-t">
              {monthExpenses.map((e, index) => (
                <div
                  key={e.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 min-h-[52px]",
                    index % 2 === 1 ? "bg-muted/30" : undefined,
                  )}
                >
                  <div className="pt-0.5 shrink-0">
                    <Checkbox
                      checked={selectedIds.has(e.id)}
                      onCheckedChange={() => onToggleSelect(e.id)}
                      aria-label={`Select ${e.description}`}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                  </div>
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left rounded-md -mx-2 px-2 py-1 -my-1 hover:bg-muted/50 active:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => onExpenseTap(e)}
                    aria-label={`${e.description}, ${formatCurrency(e.amount)}, ${e.date}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {e.description || "—"}
                      </span>
                      <span className="shrink-0 text-sm font-medium">
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <SourceIcon source={e.source} size={14} />
                      <span>{e.date}</span>
                      <span>·</span>
                      <span>{e.category || "Uncategorized"}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
