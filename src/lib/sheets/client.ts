/**
 * genjutsu-db client factory for the Google Sheets sync layer.
 *
 * Provides a typed client with repositories for all 7 domain models.
 * Data blob (Data!A1) and Totals sheet are handled outside this client.
 */

import { createClient } from "genjutsu-db";
import {
  ExpenseModel,
  MortgageModel,
  IncomeModel,
  DebtModel,
  DebtPaymentModel,
  OwnerTransferModel,
  PresetTransactionModel,
} from "./models";

export function createSheetsClient(
  spreadsheetId: string,
  getToken: () => Promise<string>,
) {
  return createClient({
    spreadsheetId,
    auth: getToken,
    schemas: {
      expenses: ExpenseModel,
      mortgage: MortgageModel,
      income: IncomeModel,
      debts: DebtModel,
      debtPayments: DebtPaymentModel,
      ownerTransfers: OwnerTransferModel,
      presetTransactions: PresetTransactionModel,
    },
  });
}

export type SheetsClient = ReturnType<typeof createSheetsClient>;
