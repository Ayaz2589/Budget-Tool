import type { TourStepInput } from "@/types/tour";

export const appTourSteps: TourStepInput[] = [
  {
    title: "Welcome to Ortho",
    content:
      "This tour walks through the updated workflow and opens key sheets so you can see where actions now happen.",
  },
  {
    title: "Dashboard",
    content: "First, we’ll jump to the dashboard summary.",
    onNextAction: { navigateTo: "/dashboard" },
  },
  {
    target: "[data-tour=\"dashboardKpis\"]",
    title: "Finance snapshot",
    content:
      "KPIs and charts here give the current financial state, trends, and debt position.",
    waitMs: 3000,
  },
  {
    title: "Transactions",
    content: "Next, we’ll open transactions.",
    onNextAction: { navigateTo: "/dashboard/transactions" },
  },
  {
    target: "[data-tour=\"toolbar\"]",
    title: "Transactions actions",
    content:
      "Filters and Add Expense are in the header on desktop and floating actions on mobile.",
    waitMs: 3000,
  },
  {
    title: "Filters sheet",
    content: "We’ll open filters/actions to show where transaction controls live.",
    onNextAction: { clickSelector: "[data-tour-action=\"openFilters\"]" },
  },
  {
    target: "[data-tour=\"filtersSheet\"]",
    title: "Filters and actions",
    content:
      "Filter by month/source/category/owner and run maintenance actions here.",
    waitMs: 2500,
  },
  {
    title: "Add Expense sheet",
    content:
      "We’ll open the add sheet now. Most create/edit actions across pages use sheets.",
    onNextAction: { clickSelector: "[data-tour-action=\"openAddExpense\"]" },
  },
  {
    target: "[data-tour=\"addExpenseSheet\"]",
    title: "Expense form",
    content:
      "Enter one or more rows, then submit. Rows can be expanded/collapsed during entry.",
    waitMs: 2500,
  },
  {
    title: "Income",
    content: "Now we’ll switch to income.",
    onNextAction: { navigateTo: "/dashboard/income" },
  },
  {
    target: "[data-tour=\"incomeList\"]",
    title: "Income list",
    content:
      "Income records are editable inline on desktop and in a sheet on mobile.",
    waitMs: 3000,
  },
  {
    title: "Add Income sheet",
    content: "Opening the add income sheet.",
    onNextAction: { clickSelector: "[data-tour-action=\"openAddIncome\"]" },
  },
  {
    target: "[data-tour=\"addIncomeSheet\"]",
    title: "Income form",
    content: "Date, amount, category, and owner are managed here.",
    waitMs: 2500,
  },
  {
    title: "Debt",
    content: "Next, the debt page.",
    onNextAction: { navigateTo: "/dashboard/debt" },
  },
  {
    target: "[data-tour=\"debtList\"]",
    title: "Debt tracking",
    content:
      "Each debt shows owner, balance, and payment history with quick actions.",
    waitMs: 3000,
  },
  {
    title: "Add Debt sheet",
    content: "Opening the add debt sheet.",
    onNextAction: { clickSelector: "[data-tour-action=\"openAddDebt\"]" },
  },
  {
    target: "[data-tour=\"addDebtSheet\"]",
    title: "Debt form",
    content: "Create debt entries with owner and starting details.",
    waitMs: 2500,
  },
  {
    title: "Mortgage",
    content: "Now we’ll review mortgage payments.",
    onNextAction: { navigateTo: "/dashboard/mortgage" },
  },
  {
    target: "[data-tour=\"paymentsList\"]",
    title: "Mortgage payments",
    content: "Mortgage payments are tracked separately from transactions.",
    waitMs: 3000,
  },
  {
    title: "Add mortgage payment sheet",
    content: "Opening the add mortgage payment sheet.",
    onNextAction: { clickSelector: "[data-tour-action=\"openAddMortgage\"]" },
  },
  {
    target: "[data-tour=\"addMortgageSheet\"]",
    title: "Mortgage form",
    content: "Capture payment date, amount, and owner here.",
    waitMs: 2500,
  },
  {
    title: "Data page",
    content: "Next, import/export data tools.",
    onNextAction: { navigateTo: "/dashboard/import" },
  },
  {
    target: "[data-tour=\"uploadCard\"]",
    title: "Import sources",
    content:
      "Upload statements, import export strings/JSON, and run dataset exports from here.",
    waitMs: 3000,
  },
  {
    title: "Presets",
    content: "Now we’ll open presets.",
    onNextAction: { navigateTo: "/dashboard/presets" },
  },
  {
    target: "[data-tour=\"presets\"]",
    title: "Presets list",
    content:
      "Presets store reusable source/category/owner defaults for faster entry.",
    waitMs: 3000,
  },
  {
    title: "Settings",
    content: "Finally, settings.",
    onNextAction: { navigateTo: "/dashboard/settings" },
  },
  {
    target: "[data-tour=\"categories\"]",
    title: "Categories and owners",
    content: "Manage categories, owners, and card sources here.",
    waitMs: 3000,
  },
  {
    target: "[data-tour=\"googleSheets\"]",
    title: "Google Sheets",
    content: "Connect and sync with Google Sheets from this section.",
  },
  {
    title: "Tour complete",
    content:
      "You can re-open this tour anytime using the help icon on supported pages.",
  },
];

export const transactionsTourSteps: TourStepInput[] = appTourSteps;
export const importTourSteps: TourStepInput[] = appTourSteps;
export const incomeTourSteps: TourStepInput[] = appTourSteps;
export const debtTourSteps: TourStepInput[] = appTourSteps;
export const mortgageTourSteps: TourStepInput[] = appTourSteps;
export const settingsTourSteps: TourStepInput[] = appTourSteps;
