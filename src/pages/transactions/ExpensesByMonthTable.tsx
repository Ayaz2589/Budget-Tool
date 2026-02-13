import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { sumAmountsBy } from "@/lib/math";
import { getMonthLabel } from "@/lib/totals";
import { EXPENSE_SOURCE_BADGE_LABELS } from "@/lib/sourceLabels";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SortColumn,
  ExpensesByMonthTableProps,
} from "@/types/transactions";

export type { SortColumn, ExpensesByMonthTableProps };

function SortIcon({
  column,
  sortBy,
  sortDir,
}: {
  column: SortColumn;
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
}) {
  if (sortBy !== column) return <ArrowUpDown className="size-3.5 opacity-50" />;
  return sortDir === "asc" ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

export function ExpensesByMonthTable({
  byMonth,
  defaultOpenMonth,
  includeOwnerTransfersInTotals = true,
  sortBy,
  sortDir,
  onSort,
  onRowTap,
  sourceLabelKeys,
  t,
}: ExpensesByMonthTableProps) {
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
            <div className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="font-semibold">{getMonthLabel(monthKey)}</span>
                <span className="text-muted-foreground font-normal">
                  (
                  {monthExpenses.length === 1
                    ? t("transactions.transaction_one", { count: 1 })
                    : t("transactions.transaction_other", {
                        count: monthExpenses.length,
                      })}
                  )
                </span>
              </span>
                <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(sumAmountsBy(monthExpenses, (row) => {
                  if (!includeOwnerTransfersInTotals && row.kind === "owner-transfer") {
                    return 0;
                  }
                  return row.amount;
                }))}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <Table density="comfortable">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => onSort("date")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("common.date")}
                      <SortIcon
                        column="date"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => onSort("description")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("common.description")}
                      <SortIcon
                        column="description"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => onSort("amount")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("common.amount")}
                      <SortIcon
                        column="amount"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => onSort("source")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("common.source")}
                      <SortIcon
                        column="source"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => onSort("owner")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("common.owner")}
                      <SortIcon
                        column="owner"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => onSort("category")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("common.category")}
                      <SortIcon
                        column="category"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthExpenses.map((row, index) => (
                  <TableRow
                    key={`${row.kind}-${row.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onRowTap(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowTap(row);
                      }
                    }}
                    className={cn(
                      "cursor-pointer [&>td]:py-4",
                      index % 2 === 1 ? "bg-muted/30" : undefined
                    )}
                    aria-label={`${row.description || "—"}, ${formatCurrency(
                      row.amount
                    )}, ${formatDate(row.date)}`}
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate font-medium">
                      {row.kind === "owner-transfer"
                        ? row.description
                        : row.description || "—"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                          {EXPENSE_SOURCE_BADGE_LABELS[row.source]}
                        </span>
                        {sourceLabelKeys[row.source]
                          ? t(sourceLabelKeys[row.source])
                          : row.source}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.kind === "owner-transfer"
                        ? `${row.transferFromOwner} -> ${row.transferToOwner}`
                        : row.owner || t("common.noOwner")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.kind === "owner-transfer"
                        ? t("transactions.typeTransfer")
                        : row.category || t("common.uncategorized")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
