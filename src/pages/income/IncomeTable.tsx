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
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency, formatDate } from "@/lib/format";
import { getMonthLabel } from "@/lib/totals";
import type { IncomeTableProps } from "@/types/income";

export type { IncomeTableProps };

export function IncomeTable({
  byMonth,
  defaultOpenMonth,
  incomeCategories,
  ownerOptions = [],
  onEdit,
  onDelete,
  onUpdateCategory,
  onUpdateOwner,
}: IncomeTableProps) {
  const { t } = useTranslation();
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpenMonth} className="divide-y">
      {byMonth.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t("income.noIncomeEntries")}
        </div>
      ) : (
        byMonth.map(([monthKey, monthIncome]) => (
            <AccordionItem key={monthKey} value={monthKey} className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{getMonthLabel(monthKey)}</span>
                  <span className="text-muted-foreground font-normal">
                    ({monthIncome.length === 1 ? t("transactions.transaction_one", { count: 1 }) : t("transactions.transaction_other", { count: monthIncome.length })})
                  </span>
                </span>
              </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthIncome.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(i.date)}</TableCell>
                      <TableCell>{i.description}</TableCell>
                      <TableCell>{formatCurrency(i.amount)}</TableCell>
                      <TableCell>
                        <Select
                          value={i.category || "_"}
                          onValueChange={(v) =>
                            onUpdateCategory(i.id, v === "_" ? "" : v)
                          }
                        >
                          <SelectTrigger className="w-[220px] min-w-[200px]">
                            <SelectValue>
                              <CategoryOption
                                name={i.category || "Uncategorized"}
                                type="income"
                              />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">
                              <CategoryOption name="Uncategorized" type="income" />
                            </SelectItem>
                            {incomeCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                <CategoryOption name={c} type="income" />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={i.owner || "_none"}
                          onValueChange={(v) =>
                            onUpdateOwner(i.id, v === "_none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">No Owner</SelectItem>
                            {ownerOptions.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => onEdit(i)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(i.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))
      )}
    </Accordion>
  );
}
