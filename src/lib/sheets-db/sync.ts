/**
 * Batch sync orchestration for the sheets database layer.
 * Clears all sheets then writes all data in two batch API calls.
 */

import type { SyncPayload } from "./types";
import type { TransportContext } from "./transport";
import { SHEETS_API } from "./transport";
import { SHEET_CLEAR_RANGES, SHEET_WRITE_RANGES } from "./schema";
import { authError, rateLimitError, apiError } from "./errors";
import { buildExpensesValues } from "./expenses";
import { buildIncomeValues } from "./income";
import { buildDebtsValues, buildDebtPaymentsValues } from "./debts";
import { buildOwnerTransfersValues, buildPresetsValues } from "./transfers";
import { buildTotalsValues } from "./totals";

function wrapBatchError(status: number, body: string): never {
  if (status === 401) throw authError(`Batch auth failed: ${status} ${body}`);
  if (status === 429) throw rateLimitError(`Batch rate limited: ${status} ${body}`);
  throw apiError(`Batch operation failed: ${status} ${body}`);
}

export async function syncAllSheetsBatch(
  ctx: TransportContext,
  payload: SyncPayload,
): Promise<void> {
  // 1. Batch clear all sheets
  const clearRes = await fetch(`${SHEETS_API}/${ctx.spreadsheetId}/values:batchClear`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ranges: [...SHEET_CLEAR_RANGES] }),
  });
  if (!clearRes.ok) {
    const err = await clearRes.text();
    wrapBatchError(clearRes.status, err);
  }

  // 2. Batch update all sheets with fresh data
  const totalsValues = buildTotalsValues(payload.months, payload.grandTotal);
  const updateRes = await fetch(`${SHEETS_API}/${ctx.spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: [
        { range: SHEET_WRITE_RANGES.expenses, values: buildExpensesValues(payload.expenses) },
        { range: SHEET_WRITE_RANGES.mortgage, values: buildExpensesValues(payload.mortgageExpenses) },
        { range: SHEET_WRITE_RANGES.income, values: buildIncomeValues(payload.income) },
        { range: SHEET_WRITE_RANGES.debts, values: buildDebtsValues(payload.debts) },
        { range: SHEET_WRITE_RANGES.debtPayments, values: buildDebtPaymentsValues(payload.debtPayments) },
        { range: SHEET_WRITE_RANGES.ownerTransfers, values: buildOwnerTransfersValues(payload.ownerTransfers ?? []) },
        { range: SHEET_WRITE_RANGES.presets, values: buildPresetsValues(payload.presetTransactions) },
        { range: SHEET_WRITE_RANGES.data, values: [[payload.dataBlob]] },
        { range: SHEET_WRITE_RANGES.totals, values: totalsValues },
      ],
    }),
  });
  if (!updateRes.ok) {
    const err = await updateRes.text();
    wrapBatchError(updateRes.status, err);
  }
}
