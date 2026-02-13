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
import type { MortgagePaymentsTableProps } from "@/types/mortgage";
import { DsHelpTooltip } from "@/components/ds";

export type { MortgagePaymentsTableProps };

export function MortgagePaymentsTable({
  payments,
  onPaymentTap,
}: MortgagePaymentsTableProps) {
  const { t } = useTranslation();

  if (payments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("mortgage.noPaymentsYet")}
      </p>
    );
  }

  return (
    <Table density="comfortable">
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.date")}</TableHead>
          <TableHead>{t("common.description")}</TableHead>
          <TableHead>
            <span className="inline-flex items-center gap-1">
              {t("common.amount")}
              <DsHelpTooltip
                content={t("mortgage.help.amountColumn")}
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
        {payments.map((payment, index) => (
          <TableRow
            key={payment.id}
            role="button"
            tabIndex={0}
            onClick={() => onPaymentTap(payment)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPaymentTap(payment);
              }
            }}
            className={cn(
              "cursor-pointer [&>td]:py-4",
              index % 2 === 1 ? "bg-muted/30" : undefined,
            )}
            aria-label={`${payment.description || "Mortgage"}, ${formatCurrency(
              payment.amount,
            )}, ${formatDate(payment.date)}`}
          >
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(payment.date)}
            </TableCell>
            <TableCell className="max-w-[260px] truncate font-medium">
              {payment.description || "Mortgage"}
            </TableCell>
            <TableCell className="font-semibold">
              {formatCurrency(payment.amount)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {payment.owner || t("common.noOwner")}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {payment.category || "Mortgage"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
