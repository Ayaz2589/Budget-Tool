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
  CreditCard,
  ArrowLeftRight,
  Clock,
  Lightbulb,
  Receipt,
} from "lucide-react";
import { WidgetKpiNetCashFlow } from "@/pages/dashboard/widgets/WidgetKpiNetCashFlow";
import { WidgetKpiTotalSpent } from "@/pages/dashboard/widgets/WidgetKpiTotalSpent";
import { WidgetKpiTotalIncome } from "@/pages/dashboard/widgets/WidgetKpiTotalIncome";
import { WidgetKpiTotalDebt } from "@/pages/dashboard/widgets/WidgetKpiTotalDebt";
import { WidgetDebtSnapshot } from "@/pages/dashboard/widgets/WidgetDebtSnapshot";
import { WidgetSpendBySource } from "@/pages/dashboard/widgets/WidgetSpendBySource";
import { WidgetOwnerTransfers } from "@/pages/dashboard/widgets/WidgetOwnerTransfers";
import { WidgetRecentActivity } from "@/pages/dashboard/widgets/WidgetRecentActivity";
import { DashboardCashFlowChart } from "@/pages/dashboard/DashboardCashFlowChart";
import { DashboardNetCashFlowChart } from "@/pages/dashboard/DashboardNetCashFlowChart";
import { DashboardCategoryChart } from "@/pages/dashboard/DashboardCategoryChart";
import { DashboardOwnerSplit } from "@/pages/dashboard/DashboardOwnerSplit";
import { DashboardQuickAdd } from "@/pages/dashboard/DashboardQuickAdd";
import { WidgetSmartInsights } from "@/pages/dashboard/widgets/WidgetSmartInsights";
import type { WidgetType, WidgetSize, WidgetRegistryEntry } from "@/types/widget";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyProps = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry> = {
  "kpi-net-cash-flow": {
    type: "kpi-net-cash-flow",
    label: "widget.kpiNetCashFlow",
    icon: <DollarSign className="size-4" />,
    defaultSize: "sm",
    allowedSizes: ["sm", "md"],
    minH: { sm: 3, md: 4, lg: 5 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetKpiNetCashFlow netCashFlow={props.kpis.netCashFlow} size={size} />
    ),
  },
  "kpi-total-spent": {
    type: "kpi-total-spent",
    label: "widget.kpiTotalSpent",
    icon: <TrendingDown className="size-4" />,
    defaultSize: "sm",
    allowedSizes: ["sm", "md"],
    minH: { sm: 3, md: 4, lg: 5 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetKpiTotalSpent
        totalSpent={props.kpis.totalSpent}
        spentVsLastMonthPct={props.kpis.spentVsLastMonthPct}
        expenseScope={props.expenseScope}
        includeDebtPayments={props.includeDebtPayments}
        size={size}
      />
    ),
  },
  "kpi-total-income": {
    type: "kpi-total-income",
    label: "widget.kpiTotalIncome",
    icon: <TrendingUp className="size-4" />,
    defaultSize: "sm",
    allowedSizes: ["sm", "md"],
    minH: { sm: 3, md: 4, lg: 5 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetKpiTotalIncome totalIncome={props.kpis.totalIncome} size={size} />
    ),
  },
  "kpi-total-debt": {
    type: "kpi-total-debt",
    label: "widget.kpiTotalDebt",
    icon: <Landmark className="size-4" />,
    defaultSize: "sm",
    allowedSizes: ["sm", "md"],
    minH: { sm: 3, md: 4, lg: 5 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetKpiTotalDebt
        debtOutstanding={props.kpis.debtOutstanding}
        debtPaidThisMonth={props.kpis.debtPaidThisMonth}
        size={size}
      />
    ),
  },
  "quick-add": {
    type: "quick-add",
    label: "widget.quickAdd",
    icon: <Zap className="size-4" />,
    defaultSize: "lg",
    allowedSizes: ["md", "lg"],
    minH: { sm: 2, md: 4, lg: 4 },
    render: (props: AnyProps, size: WidgetSize) => (
      <DashboardQuickAdd
        presets={props.presetTransactions}
        onPresetTap={props.onPresetTap}
        onAddBlank={props.onAddBlank}
        size={size}
      />
    ),
  },
  "chart-cash-flow": {
    type: "chart-cash-flow",
    label: "widget.chartCashFlow",
    icon: <BarChart3 className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["md", "lg"],
    minH: { sm: 4, md: 8, lg: 11 },
    render: (props: AnyProps, size: WidgetSize) => (
      <DashboardCashFlowChart
        cashFlowDisplayRows={props.cashFlowDisplayRows}
        incomeOwnerKeys={props.incomeOwnerKeys}
        includeDebtPayments={props.includeDebtPayments}
        size={size}
      />
    ),
  },
  "chart-net-trend": {
    type: "chart-net-trend",
    label: "widget.chartNetTrend",
    icon: <Activity className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["md", "lg"],
    minH: { sm: 4, md: 8, lg: 11 },
    render: (props: AnyProps, size: WidgetSize) => (
      <DashboardNetCashFlowChart
        netCashFlowRows={props.netCashFlowRows}
        range={props.range}
        size={size}
      />
    ),
  },
  "chart-category": {
    type: "chart-category",
    label: "widget.chartCategory",
    icon: <PieChart className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["md", "lg"],
    minH: { sm: 4, md: 8, lg: 11 },
    render: (props: AnyProps, size: WidgetSize) => (
      <DashboardCategoryChart categorySlices={props.categorySlices} size={size} />
    ),
  },
  "chart-owner-split": {
    type: "chart-owner-split",
    label: "widget.chartOwnerSplit",
    icon: <Users className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["md", "lg"],
    minH: { sm: 4, md: 8, lg: 13 },
    render: (props: AnyProps, size: WidgetSize) => (
      <DashboardOwnerSplit
        ownerSlices={props.ownerSlices}
        visibleOwnerNetRows={props.visibleOwnerNetRows}
        ownerExpenseItemsByOwner={props.ownerExpenseItemsByOwner}
        totalSpentForSelectedRange={props.totalSpentForSelectedRange}
        percentFormatter={props.percentFormatter}
        size={size}
      />
    ),
  },
  "debt-snapshot": {
    type: "debt-snapshot",
    label: "widget.debtSnapshot",
    icon: <Receipt className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["sm", "md", "lg"],
    minH: { sm: 5, md: 8, lg: 11 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetDebtSnapshot debtRows={props.debtRows} size={size} />
    ),
  },
  "spend-by-source": {
    type: "spend-by-source",
    label: "widget.spendBySource",
    icon: <CreditCard className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["sm", "md", "lg"],
    minH: { sm: 5, md: 8, lg: 11 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetSpendBySource spendBySourceRows={props.spendBySourceRows} size={size} />
    ),
  },
  "owner-transfers": {
    type: "owner-transfers",
    label: "widget.ownerTransfers",
    icon: <ArrowLeftRight className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["sm", "md", "lg"],
    minH: { sm: 5, md: 8, lg: 11 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetOwnerTransfers
        ownerTransfersMtd={props.ownerTransfersMtd}
        ownerTransfersMtdTotal={props.ownerTransfersMtdTotal}
        size={size}
      />
    ),
  },
  "recent-activity": {
    type: "recent-activity",
    label: "widget.recentActivity",
    icon: <Clock className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["sm", "md", "lg"],
    minH: { sm: 5, md: 8, lg: 11 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetRecentActivity recentActivity={props.recentActivity} size={size} />
    ),
  },
  "smart-insights": {
    type: "smart-insights",
    label: "widget.smartInsights",
    icon: <Lightbulb className="size-4" />,
    defaultSize: "sm",
    allowedSizes: ["sm", "md"],
    minH: { sm: 5, md: 6, lg: 8 },
    render: (props: AnyProps, size: WidgetSize) => (
      <WidgetSmartInsights
        insights={props.insights}
        onDismiss={props.dismissInsight}
        size={size}
      />
    ),
  },
};
