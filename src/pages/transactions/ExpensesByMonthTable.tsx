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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { SourceIcon } from "@/components/cards";
import { formatCurrency } from "@/lib/format";
import { getMonthLabel } from "@/lib/totals";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  sortBy,
  sortDir,
  onSort,
  onUpdateCategory,
  onUpdateOwner,
  expenseCategories,
  ownerOptions = [],
  onDeleteOne,
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("common.id")}</TableHead>
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
                  <TableHead className="w-[80px]">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthExpenses.map((e, index) => (
                  <TableRow
                    key={e.id}
                    className={index % 2 === 1 ? "bg-muted/30" : undefined}
                  >
                    <TableCell
                      className="font-mono text-xs max-w-[100px] truncate"
                      title={e.id}
                    >
                      {e.id}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {e.date}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {e.description}
                    </TableCell>
                    <TableCell>{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <SourceIcon source={e.source} size={20} />
                        {sourceLabelKeys[e.source]
                          ? t(sourceLabelKeys[e.source])
                          : e.source}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Select
                        value={e.owner || "_none"}
                        onValueChange={(v) =>
                          onUpdateOwner(e.id, v === "_none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-[160px] min-w-[140px]">
                          <SelectValue placeholder={t("common.noOwner")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">
                            {t("common.noOwner")}
                          </SelectItem>
                          {ownerOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={e.category || "_"}
                        onValueChange={(v) =>
                          onUpdateCategory(e.id, v === "_" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-[220px] min-w-[200px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_">
                            <CategoryOption
                              name="Uncategorized"
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
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteOne(e)}
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
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
