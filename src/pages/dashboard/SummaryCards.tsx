import { useTranslation } from "react-i18next";
import type { MonthTotals } from "@/lib/totals";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardsProps {
  selectedMonth: MonthTotals;
  grand: MonthTotals;
}

export function SummaryCards({ selectedMonth, grand }: SummaryCardsProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="grid gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.totalEarned")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatCurrency(selectedMonth.totalEarned)}
            </span>
          </CardContent>
        </Card>
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.totalSpent")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatCurrency(selectedMonth.totalSpent)}
            </span>
          </CardContent>
        </Card>
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.totalSpentWoMortgage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatCurrency(selectedMonth.totalSpentWithoutMortgage)}
            </span>
          </CardContent>
        </Card>
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.split5050")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatCurrency(selectedMonth.split5050)}
            </span>
          </CardContent>
        </Card>
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.tasnuvasTotalSpending")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatCurrency(selectedMonth.novasTotalSpending)}
            </span>
          </CardContent>
        </Card>
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.myTotalSpendingWoMortgage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatCurrency(selectedMonth.myTotalSpendingWithoutMortgage)}
            </span>
          </CardContent>
        </Card>
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.totalSaved")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatCurrency(selectedMonth.totalSaved)}
            </span>
          </CardContent>
        </Card>
        <Card className="py-3 gap-2 md:py-6 md:gap-6">
          <CardHeader className="pb-1 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
              {t("dashboard.personalSavingsRate")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 md:px-6">
            <span className="text-xl font-semibold md:text-2xl">
              {formatPercent(selectedMonth.personalSavingsRate)}
            </span>
          </CardContent>
        </Card>
      </div>
      <Card className="py-3 md:py-6">
        <CardHeader className="px-3 md:px-6">
          <CardTitle className="text-sm md:text-base">
            {t("dashboard.allTimeTotals")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <p className="text-muted-foreground text-sm">
            {t("dashboard.allTimeTotalsLine", {
              earned: formatCurrency(grand.totalEarned),
              spent: formatCurrency(grand.totalSpent),
              saved: formatCurrency(grand.totalSaved),
            })}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
