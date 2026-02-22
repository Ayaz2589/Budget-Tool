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
import { QuickAdd } from "@/pages/dashboard/widgets/QuickAdd";
import { SmartInsights } from "@/pages/dashboard/widgets/SmartInsights";
import type { WidgetType, WidgetSize, WidgetRegistryEntry } from "@/types/widget";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyProps = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry> = {
  "net-cash-flow": {
    type: "net-cash-flow",
    label: "widget.netCashFlow",
    icon: <DollarSign className="size-4" />,
    defaultSize: "wide",
    allowedSizes: ["sm", "wide", "md"],

    render: (props: AnyProps, size: WidgetSize) => (
      <NetCashFlow netCashFlow={props.kpis.netCashFlow} size={size} />
    ),
  },
  "total-spent": {
    type: "total-spent",
    label: "widget.totalSpent",
    icon: <TrendingDown className="size-4" />,
    defaultSize: "wide",
    allowedSizes: ["sm", "wide", "md"],

    render: (props: AnyProps, size: WidgetSize) => (
      <TotalSpent
        totalSpent={props.kpis.totalSpent}
        spentVsLastMonthPct={props.kpis.spentVsLastMonthPct}
        expenseScope={props.expenseScope}
        includeDebtPayments={props.includeDebtPayments}
        size={size}
      />
    ),
  },
  "total-income": {
    type: "total-income",
    label: "widget.totalIncome",
    icon: <TrendingUp className="size-4" />,
    defaultSize: "wide",
    allowedSizes: ["sm", "wide", "md"],

    render: (props: AnyProps, size: WidgetSize) => (
      <TotalIncome totalIncome={props.kpis.totalIncome} size={size} />
    ),
  },
  "total-debt": {
    type: "total-debt",
    label: "widget.totalDebt",
    icon: <Landmark className="size-4" />,
    defaultSize: "wide",
    allowedSizes: ["sm", "wide", "md"],

    render: (props: AnyProps, size: WidgetSize) => (
      <TotalDebt
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
    defaultSize: "md",
    allowedSizes: ["md", "lg", "xl"],
    render: (props: AnyProps, size: WidgetSize) => (
      <QuickAdd
        presets={props.presetTransactions}
        onPresetTap={props.onPresetTap}
        onAddBlank={props.onAddBlank}
        size={size}
      />
    ),
  },
  "cash-flow-chart": {
    type: "cash-flow-chart",
    label: "widget.cashFlowChart",
    icon: <BarChart3 className="size-4" />,
    defaultSize: "xl",
    allowedSizes: ["md", "lg", "xl"],
    render: (props: AnyProps, size: WidgetSize) => (
      <CashFlowChart
        cashFlowDisplayRows={props.cashFlowDisplayRows}
        incomeOwnerKeys={props.incomeOwnerKeys}
        includeDebtPayments={props.includeDebtPayments}
        size={size}
      />
    ),
  },
  "net-trend-chart": {
    type: "net-trend-chart",
    label: "widget.netTrendChart",
    icon: <Activity className="size-4" />,
    defaultSize: "wide-lg",
    allowedSizes: ["md", "wide-lg"],
    render: (props: AnyProps, size: WidgetSize) => (
      <NetTrendChart
        netCashFlowRows={props.netCashFlowRows}
        range={props.range}
        size={size}
      />
    ),
  },
  "category-chart": {
    type: "category-chart",
    label: "widget.categoryChart",
    icon: <PieChart className="size-4" />,
    defaultSize: "xl",
    allowedSizes: ["md", "lg", "xl"],
    render: (props: AnyProps, size: WidgetSize) => (
      <CategoryChart categorySlices={props.categorySlices} size={size} />
    ),
  },
  "owner-split-chart": {
    type: "owner-split-chart",
    label: "widget.ownerSplitChart",
    icon: <Users className="size-4" />,
    defaultSize: "xl",
    allowedSizes: ["md", "lg", "xl"],
    render: (props: AnyProps, size: WidgetSize) => (
      <OwnerSplitChart
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
    allowedSizes: ["sm", "md", "tall", "lg", "xl"],

    render: (props: AnyProps, size: WidgetSize) => (
      <DebtSnapshot debtRows={props.debtRows} size={size} />
    ),
  },
  "spend-by-source": {
    type: "spend-by-source",
    label: "widget.spendBySource",
    icon: <CreditCard className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["sm", "md", "tall", "lg", "xl"],

    render: (props: AnyProps, size: WidgetSize) => (
      <SpendBySource spendBySourceRows={props.spendBySourceRows} size={size} />
    ),
  },
  "owner-transfers": {
    type: "owner-transfers",
    label: "widget.ownerTransfers",
    icon: <ArrowLeftRight className="size-4" />,
    defaultSize: "md",
    allowedSizes: ["sm", "md", "tall", "lg", "xl"],

    render: (props: AnyProps, size: WidgetSize) => (
      <OwnerTransfers
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
    allowedSizes: ["sm", "md", "tall", "lg", "xl"],

    render: (props: AnyProps, size: WidgetSize) => (
      <RecentActivity recentActivity={props.recentActivity} size={size} />
    ),
  },
  "smart-insights": {
    type: "smart-insights",
    label: "widget.smartInsights",
    icon: <Lightbulb className="size-4" />,
    defaultSize: "sm",
    allowedSizes: ["sm", "wide", "md"],

    render: (props: AnyProps, size: WidgetSize) => (
      <SmartInsights
        insights={props.insights}
        onDismiss={props.dismissInsight}
        size={size}
      />
    ),
  },
};
