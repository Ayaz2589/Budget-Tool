import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Landmark,
  Zap,
  BarChart3,
  Activity,
  PieChart,
  Users,
  UserCheck,
  CreditCard,
  ArrowLeftRight,
  Clock,
  Lightbulb,
  Receipt,
} from "lucide-react";
import { NetCashFlow } from "@/pages/dashboard/widgets/NetCashFlow";
import { TotalSpent } from "@/pages/dashboard/widgets/TotalSpent";
import { TotalIncome } from "@/pages/dashboard/widgets/TotalIncome";
import { TotalDebt } from "@/pages/dashboard/widgets/TotalDebt";
import { DebtSnapshot } from "@/pages/dashboard/widgets/DebtSnapshot";
import { SpendBySource } from "@/pages/dashboard/widgets/SpendBySource";
import { OwnerTransfers } from "@/pages/dashboard/widgets/OwnerTransfers";
import { RecentActivity } from "@/pages/dashboard/widgets/RecentActivity";
import { CashFlowChart } from "@/pages/dashboard/widgets/CashFlowChart";
import { NetTrendChart } from "@/pages/dashboard/widgets/NetTrendChart";
import { CategoryChart } from "@/pages/dashboard/widgets/CategoryChart";
import { OwnerSplitChart } from "@/pages/dashboard/widgets/OwnerSplitChart";
import { OwnerExpenseByOwner } from "@/pages/dashboard/widgets/OwnerExpenseByOwner";
import { QuickAdd } from "@/pages/dashboard/widgets/QuickAdd";
import { SmartInsights } from "@/pages/dashboard/widgets/SmartInsights";
import type { WidgetType, WidgetSize, WidgetRegistryEntry } from "@/lib/widgets/widget";
import { createWidget } from "@/lib/widgets/createWidget";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyProps = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const KPI_DIMS = { sm: { w: 3, h: 2 }, md: { w: 6, h: 2 }, lg: { w: 6, h: 3 } } as const;
const CHART_WIDE_DIMS = { sm: { w: 6, h: 3 }, md: { w: 12, h: 6 }, lg: { w: 12, h: 8 } } as const;
const LIST_DIMS = { sm: { w: 3, h: 2 }, md: { w: 6, h: 6 }, lg: { w: 12, h: 6 } } as const;

export const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry> = {
  "net-cash-flow": createWidget({
    ...KPI_DIMS,
    type: "net-cash-flow",
    label: "widget.netCashFlow",
    icon: <DollarSign className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <NetCashFlow netCashFlow={props.kpis.netCashFlow} sparklineRows={props.kpiSparklineRows} size={size} />
    ),
  }),
  "total-spent": createWidget({
    ...KPI_DIMS,
    type: "total-spent",
    label: "widget.totalSpent",
    icon: <TrendingDown className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <TotalSpent
        totalSpent={props.kpis.totalSpent}
        spentVsLastMonthPct={props.kpis.spentVsLastMonthPct}
        sparklineRows={props.kpiSparklineRows}
        expenseScope={props.expenseScope}
        includeDebtPayments={props.includeDebtPayments}
        size={size}
      />
    ),
  }),
  "total-income": createWidget({
    ...KPI_DIMS,
    type: "total-income",
    label: "widget.totalIncome",
    icon: <TrendingUp className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <TotalIncome totalIncome={props.kpis.totalIncome} sparklineRows={props.kpiSparklineRows} size={size} />
    ),
  }),
  "total-debt": createWidget({
    ...KPI_DIMS,
    type: "total-debt",
    label: "widget.totalDebt",
    icon: <Landmark className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <TotalDebt
        debtOutstanding={props.kpis.debtOutstanding}
        debtPaidThisMonth={props.kpis.debtPaidThisMonth}
        sparklineRows={props.kpiSparklineRows}
        size={size}
      />
    ),
  }),
  "quick-add": createWidget({
    type: "quick-add",
    label: "widget.quickAdd",
    icon: <Zap className="size-4" />,
    sm: { w: 6, h: 3 },
    md: { w: 12, h: 4 },
    lg: { w: 12, h: 6 },
    render: (props: AnyProps, size: WidgetSize) => (
      <QuickAdd
        presets={props.presetTransactions}
        onPresetTap={props.onPresetTap}
        onAddBlank={props.onAddBlank}
        size={size}
      />
    ),
  }),
  "cash-flow-chart": createWidget({
    ...CHART_WIDE_DIMS,
    type: "cash-flow-chart",
    label: "widget.cashFlowChart",
    icon: <BarChart3 className="size-4" />,
    defaultSize: "lg",
    render: (props: AnyProps, size: WidgetSize) => (
      <CashFlowChart
        cashFlowDisplayRows={props.cashFlowDisplayRows}
        incomeOwnerKeys={props.incomeOwnerKeys}
        includeDebtPayments={props.includeDebtPayments}
        size={size}
      />
    ),
  }),
  "net-trend-chart": createWidget({
    type: "net-trend-chart",
    label: "widget.netTrendChart",
    icon: <Activity className="size-4" />,
    sm: { w: 6, h: 2 },
    md: { w: 9, h: 3 },
    lg: { w: 12, h: 6 },
    render: (props: AnyProps, size: WidgetSize) => (
      <NetTrendChart
        netCashFlowRows={props.netCashFlowRows}
        range={props.range}
        size={size}
      />
    ),
  }),
  "category-chart": createWidget({
    type: "category-chart",
    label: "widget.categoryChart",
    icon: <PieChart className="size-4" />,
    defaultSize: "lg",
    sm: { w: 6, h: 3 },
    md: { w: 9, h: 4 },
    lg: { w: 12, h: 5 },
    render: (props: AnyProps, size: WidgetSize) => (
      <CategoryChart categorySlices={props.categorySlices} size={size} />
    ),
  }),
  "owner-split-chart": createWidget({
    type: "owner-split-chart",
    label: "widget.ownerSplitChart",
    icon: <Users className="size-4" />,
    defaultSize: "lg",
    sm: { w: 6, h: 3 },
    md: { w: 9, h: 4 },
    lg: { w: 12, h: 5 },
    render: (props: AnyProps, size: WidgetSize) => (
      <OwnerSplitChart
        ownerSlices={props.ownerSlices}
        size={size}
      />
    ),
  }),
  "owner-expense-by-owner": createWidget({
    ...LIST_DIMS,
    type: "owner-expense-by-owner",
    label: "widget.ownerExpenseByOwner",
    icon: <UserCheck className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <OwnerExpenseByOwner
        visibleOwnerNetRows={props.visibleOwnerNetRows}
        ownerExpenseItemsByOwner={props.ownerExpenseItemsByOwner}
        totalSpentForSelectedRange={props.totalSpentForSelectedRange}
        percentFormatter={props.percentFormatter}
        size={size}
      />
    ),
  }),
  "debt-snapshot": createWidget({
    ...LIST_DIMS,
    type: "debt-snapshot",
    label: "widget.debtSnapshot",
    icon: <Receipt className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <DebtSnapshot debtRows={props.debtRows} size={size} />
    ),
  }),
  "spend-by-source": createWidget({
    ...LIST_DIMS,
    type: "spend-by-source",
    label: "widget.spendBySource",
    icon: <CreditCard className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <SpendBySource spendBySourceRows={props.spendBySourceRows} size={size} />
    ),
  }),
  "owner-transfers": createWidget({
    ...LIST_DIMS,
    type: "owner-transfers",
    label: "widget.ownerTransfers",
    icon: <ArrowLeftRight className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <OwnerTransfers
        ownerTransfersMtd={props.ownerTransfersMtd}
        ownerTransfersMtdTotal={props.ownerTransfersMtdTotal}
        size={size}
      />
    ),
  }),
  "recent-activity": createWidget({
    ...LIST_DIMS,
    type: "recent-activity",
    label: "widget.recentActivity",
    icon: <Clock className="size-4" />,
    render: (props: AnyProps, size: WidgetSize) => (
      <RecentActivity recentActivity={props.recentActivity} size={size} />
    ),
  }),
  "smart-insights": createWidget({
    ...KPI_DIMS,
    type: "smart-insights",
    label: "widget.smartInsights",
    icon: <Lightbulb className="size-4" />,
    defaultSize: "sm",
    render: (props: AnyProps, size: WidgetSize) => (
      <SmartInsights
        insights={props.insights}
        onDismiss={props.dismissInsight}
        size={size}
      />
    ),
  }),
};
