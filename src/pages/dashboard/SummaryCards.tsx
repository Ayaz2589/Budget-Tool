import { useTranslation } from "react-i18next";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryCardsProps } from "@/types/dashboard";

export function SummaryCards({ selectedMonth }: SummaryCardsProps) {
  const { t } = useTranslation();
  const cardClass = "py-2 gap-1 md:py-3 md:gap-2";
  const headerClass = "pb-0.5 px-2 md:pb-1 md:px-3";
  const contentClass = "px-2 pt-0 md:px-3";

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 md:gap-2 lg:grid-cols-3">
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.totalEarned")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatCurrency(selectedMonth.totalEarned)}
            </span>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.totalSpent")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatCurrency(selectedMonth.totalSpent)}
            </span>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.totalSpentWoMortgage")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatCurrency(selectedMonth.totalSpentWithoutMortgage)}
            </span>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.split5050")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatCurrency(selectedMonth.split5050)}
            </span>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.tasnuvasTotalSpending")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatCurrency(selectedMonth.novasTotalSpending)}
            </span>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.myTotalSpendingWoMortgage")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatCurrency(selectedMonth.myTotalSpendingWithoutMortgage)}
            </span>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.totalSaved")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatCurrency(selectedMonth.totalSaved)}
            </span>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.personalSavingsRate")}
            </CardTitle>
          </CardHeader>
          <CardContent className={contentClass}>
            <span className="text-lg font-semibold md:text-xl">
              {formatPercent(selectedMonth.personalSavingsRate)}
            </span>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
