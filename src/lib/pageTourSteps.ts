import type { TourStepInput } from "./runPageTour";

export const dashboardTourSteps: TourStepInput[] = [
  { titleKey: "tour.dashboard.introTitle", contentKey: "tour.dashboard.introContent" },
  { target: "[data-tour=\"monthSelector\"]", titleKey: "tour.dashboard.monthSelectorTitle", contentKey: "tour.dashboard.monthSelectorContent" },
  { target: "[data-tour=\"summary\"]", titleKey: "tour.dashboard.summaryTitle", contentKey: "tour.dashboard.summaryContent" },
  { target: "[data-tour=\"overview\"]", titleKey: "tour.dashboard.overviewTitle", contentKey: "tour.dashboard.overviewContent" },
  { target: "[data-tour=\"debt\"]", titleKey: "tour.dashboard.debtTitle", contentKey: "tour.dashboard.debtContent" },
  { target: "[data-tour=\"byMonth\"]", titleKey: "tour.dashboard.byMonthTitle", contentKey: "tour.dashboard.byMonthContent" },
];

export const transactionsTourSteps: TourStepInput[] = [
  { titleKey: "tour.transactions.introTitle", contentKey: "tour.transactions.introContent" },
  { target: "[data-tour=\"toolbar\"]", titleKey: "tour.transactions.toolbarTitle", contentKey: "tour.transactions.toolbarContent" },
  { target: "[data-tour=\"expensesList\"]", titleKey: "tour.transactions.expensesListTitle", contentKey: "tour.transactions.expensesListContent" },
];

export const importTourSteps: TourStepInput[] = [
  { titleKey: "tour.import.introTitle", contentKey: "tour.import.introContent" },
  { target: "[data-tour=\"uploadCard\"]", titleKey: "tour.import.uploadCardTitle", contentKey: "tour.import.uploadCardContent" },
  { target: "[data-tour=\"previewCard\"]", titleKey: "tour.import.previewCardTitle", contentKey: "tour.import.previewCardContent" },
];

export const incomeTourSteps: TourStepInput[] = [
  { titleKey: "tour.income.introTitle", contentKey: "tour.income.introContent" },
  { target: "[data-tour=\"addIncome\"]", titleKey: "tour.income.addIncomeTitle", contentKey: "tour.income.addIncomeContent" },
  { target: "[data-tour=\"incomeList\"]", titleKey: "tour.income.incomeListTitle", contentKey: "tour.income.incomeListContent" },
];

export const debtTourSteps: TourStepInput[] = [
  { titleKey: "tour.debt.introTitle", contentKey: "tour.debt.introContent" },
  { target: "[data-tour=\"addDebt\"]", titleKey: "tour.debt.addDebtTitle", contentKey: "tour.debt.addDebtContent" },
  { target: "[data-tour=\"debtList\"]", titleKey: "tour.debt.debtListTitle", contentKey: "tour.debt.debtListContent" },
];

export const mortgageTourSteps: TourStepInput[] = [
  { titleKey: "tour.mortgage.introTitle", contentKey: "tour.mortgage.introContent" },
  { target: "[data-tour=\"addPayment\"]", titleKey: "tour.mortgage.addPaymentTitle", contentKey: "tour.mortgage.addPaymentContent" },
  { target: "[data-tour=\"paymentsList\"]", titleKey: "tour.mortgage.paymentsListTitle", contentKey: "tour.mortgage.paymentsListContent" },
];

export const settingsTourSteps: TourStepInput[] = [
  { titleKey: "tour.settings.introTitle", contentKey: "tour.settings.introContent" },
  { target: "[data-tour=\"googleSheets\"]", titleKey: "tour.settings.googleSheetsTitle", contentKey: "tour.settings.googleSheetsContent" },
  { target: "[data-tour=\"categories\"]", titleKey: "tour.settings.categoriesTitle", contentKey: "tour.settings.categoriesContent" },
  { target: "[data-tour=\"deleteAll\"]", titleKey: "tour.settings.deleteAllTitle", contentKey: "tour.settings.deleteAllContent" },
];
