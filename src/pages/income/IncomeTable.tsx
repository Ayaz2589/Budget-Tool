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
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { sumAmountsBy } from "@/lib/math";
import { getMonthLabel } from "@/lib/totals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DsHelpTooltip } from "@/components/ds";
import { CategoryOption } from "@/lib/categoryColors";
import type { IncomeTableProps } from "@/types/income";

export type { IncomeTableProps };

export function IncomeTable({
  byMonth,
  defaultOpenMonth,
  onIncomeTap,
  onUpdateCategory,
  onUpdateOwner,
  incomeCategories,
  ownerOptions,
}: IncomeTableProps) {
  const { t } = useTranslation();
  const inlineEditing = !!(onUpdateCategory && onUpdateOwner && incomeCategories && ownerOptions);

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpenMonth}
      className="divide-y"
    >
      {byMonth.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t("income.noIncomeEntries")}
        </div>
      ) : (
        byMonth.map(([monthKey, monthIncome]) => (
          <AccordionItem key={monthKey} value={monthKey} className="border-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <div className="flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{getMonthLabel(monthKey)}</span>
                  <span className="text-muted-foreground font-normal">
                    (
                    {monthIncome.length === 1
                      ? t("transactions.transaction_one", { count: 1 })
                      : t("transactions.transaction_other", {
                          count: monthIncome.length,
                        })}
                    )
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                  {formatCurrency(sumAmountsBy(monthIncome, (row) => row.amount))}
                  <DsHelpTooltip
                    content={t("income.help.monthTotal")}
                    ariaLabel={t("common.help")}
                    asChildSpan
                  />
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <Table density="comfortable">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("common.description")}</TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        {t("common.amount")}
                        <DsHelpTooltip
                          content={t("income.help.amountColumn")}
                          ariaLabel={t("common.help")}
                          asChildSpan
                        />
                      </span>
                    </TableHead>
                    <TableHead>{t("common.owner")}</TableHead>
                    <TableHead>{t("common.category")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthIncome.map((i, index) => (
                    <TableRow
                      key={i.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onIncomeTap(i)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onIncomeTap(i);
                        }
                      }}
                      className={cn(
                        "cursor-pointer [&>td]:py-4",
                        index % 2 === 1 ? "bg-muted/30" : undefined,
                      )}
                      aria-label={`${i.description || "—"}, ${formatCurrency(
                        i.amount,
                      )}, ${formatDate(i.date)}`}
                    >
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(i.date)}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate font-medium">
                        {i.description || "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(i.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inlineEditing ? (
                          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <Select
                              value={i.owner || "_none"}
                              onValueChange={(v) => onUpdateOwner(i.id, v === "_none" ? "" : v)}
                            >
                              <SelectTrigger className="h-auto border-0 bg-transparent shadow-none px-0 py-0 text-muted-foreground hover:bg-muted/50 rounded data-[size=default]:h-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                                {ownerOptions.map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          i.owner || t("common.noOwner")
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inlineEditing ? (
                          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <Select
                              value={i.category || "_"}
                              onValueChange={(v) => onUpdateCategory(i.id, v === "_" ? "" : v)}
                            >
                              <SelectTrigger className="h-auto border-0 bg-transparent shadow-none px-0 py-0 text-muted-foreground hover:bg-muted/50 rounded data-[size=default]:h-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_">
                                  <CategoryOption name={t("common.uncategorized")} type="income" />
                                </SelectItem>
                                {incomeCategories.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    <CategoryOption name={c} type="income" />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          i.category || t("common.uncategorized")
                        )}
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
