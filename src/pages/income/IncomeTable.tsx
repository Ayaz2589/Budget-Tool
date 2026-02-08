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
import { getMonthLabel } from "@/lib/totals";
import type { IncomeTableProps } from "@/types/income";

export type { IncomeTableProps };

export function IncomeTable({
  byMonth,
  defaultOpenMonth,
  onIncomeTap,
}: IncomeTableProps) {
  const { t } = useTranslation();

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
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("common.description")}</TableHead>
                    <TableHead>{t("common.amount")}</TableHead>
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
                        {i.owner || t("common.noOwner")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {i.category || t("common.uncategorized")}
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
