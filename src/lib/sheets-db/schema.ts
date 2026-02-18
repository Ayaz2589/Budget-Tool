/**
 * Sheet name constants, A1-notation ranges, and header definitions.
 */

export const SHEET_NAMES = {
  expenses: "Expenses",
  mortgage: "Mortgage",
  income: "Income",
  debts: "Debts",
  debtPayments: "DebtPayments",
  ownerTransfers: "OwnerTransfers",
  presetTransactions: "PresetTransactions",
  data: "Data",
  totals: "Totals",
} as const;

export const ALL_SHEET_TITLES = Object.values(SHEET_NAMES);

export const SHEET_RANGES = {
  expensesRead: `${SHEET_NAMES.expenses}!A2:G`,
  mortgageRead: `${SHEET_NAMES.mortgage}!A2:G`,
  incomeRead: `${SHEET_NAMES.income}!A2:E`,
  debtsRead: `${SHEET_NAMES.debts}!A2:E`,
  debtPaymentsRead: `${SHEET_NAMES.debtPayments}!A2:E`,
  ownerTransfersRead: `${SHEET_NAMES.ownerTransfers}!A2:F`,
  presetsRead: `${SHEET_NAMES.presetTransactions}!A2:E`,
  dataCell: `${SHEET_NAMES.data}!A1`,
} as const;

export const SHEET_WRITE_RANGES = {
  expenses: `${SHEET_NAMES.expenses}!A1:G`,
  mortgage: `${SHEET_NAMES.mortgage}!A1:G`,
  income: `${SHEET_NAMES.income}!A1:E`,
  debts: `${SHEET_NAMES.debts}!A1:E`,
  debtPayments: `${SHEET_NAMES.debtPayments}!A1:E`,
  ownerTransfers: `${SHEET_NAMES.ownerTransfers}!A1:F`,
  presets: `${SHEET_NAMES.presetTransactions}!A1:E`,
  data: `${SHEET_NAMES.data}!A1`,
  totals: `${SHEET_NAMES.totals}!A1:Z100`,
} as const;

export const SHEET_CLEAR_RANGES = [
  `${SHEET_NAMES.expenses}!A1:G10000`,
  `${SHEET_NAMES.mortgage}!A1:G10000`,
  `${SHEET_NAMES.income}!A1:E10000`,
  `${SHEET_NAMES.debts}!A1:E10000`,
  `${SHEET_NAMES.debtPayments}!A1:E10000`,
  `${SHEET_NAMES.ownerTransfers}!A1:F10000`,
  `${SHEET_NAMES.presetTransactions}!A1:E10000`,
  `${SHEET_NAMES.data}!A1:A1`,
  `${SHEET_NAMES.totals}!A1:O1000`,
] as const;

export const EXPENSE_HEADERS = ["ID", "Date", "Amount", "Description", "Category", "Source", "Owner"];
export const INCOME_HEADERS = ["Date", "Amount", "Description", "Category", "Owner"];
export const DEBT_HEADERS = ["Id", "Name", "Initial Amount", "Start Date", "Owner"];
export const DEBT_PAYMENT_HEADERS = ["Id", "Debt Id", "Date", "Amount", "Note"];
export const OWNER_TRANSFER_HEADERS = ["Id", "Date", "From Owner", "To Owner", "Amount", "Note"];
export const PRESET_HEADERS = ["Id", "Source", "Description", "Category", "Owner"];
