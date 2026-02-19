/**
 * Aggregated Ortho schema definitions.
 */

import { expenseSchema, mortgageSchema } from "./expenses";
import { incomeSchema } from "./income";
import { debtSchema, debtPaymentSchema } from "./debts";
import { ownerTransferSchema, presetSchema } from "./transfers";
import { totalsSchema } from "./totals";
import { dataBlobSchema } from "./data-blob";

export const ORTHO_SCHEMAS = {
  expenses: expenseSchema,
  mortgage: mortgageSchema,
  income: incomeSchema,
  debts: debtSchema,
  debtPayments: debtPaymentSchema,
  ownerTransfers: ownerTransferSchema,
  presets: presetSchema,
  totals: totalsSchema,
  dataBlob: dataBlobSchema,
} as const;

export {
  expenseSchema,
  mortgageSchema,
  incomeSchema,
  debtSchema,
  debtPaymentSchema,
  ownerTransferSchema,
  presetSchema,
  totalsSchema,
  dataBlobSchema,
};
