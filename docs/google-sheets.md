# Google Sheets

## Overview

The app can sync data to a Google Sheet (push) and restore data from a Sheet (pull). No automatic sync; user triggers from Settings. Requires Google sign-in; token is used for Sheets API and userinfo.

## Storage keys

- **budget-tool-google-access-token** — JSON: `{ access_token, expires_at? }`. Read on load; cleared when expired or on sign-out or 401.
- **budget-tool-spreadsheet-id** — Spreadsheet ID string. Set in Settings.

## Sync to Google Sheets (push)

1. User clicks "Sync to Google Sheets" in Settings.
2. **GoogleAuthContext.syncToSheets** runs: ensures sheets exist, then clears and writes:
   - Expenses (non-mortgage), Mortgage, Income, Debts, DebtPayments, Rules, PresetTransactions.
   - Data blob (V2): serialized via `serializeToBlob` from minifiedPayload (expenses, income, debts, debtPayments, rules, presets, cardSources).
   - Totals sheet (monthly rows + grand total).
   - Applies formatting (headers, currency).

All write operations use the Sheets API v4 with the user's OAuth token. Module: **src/lib/googleSheets.ts** (clearAndWrite*, writeDataBlob, writeTotalsSheet, applySheetsFormatting).

## Restore from Sheet (pull)

1. User clicks "Restore from Sheet" in Settings.
2. **GoogleAuthContext.pullFromSheet** runs: reads Data blob via `readDataBlob`. If blob starts with V2, parses with `parseFromBlob` and merges: adds new expenses/income/debts/debt payments; replaces rules and presets if sheet has data; restores cardSources if present. If no V2 blob, falls back to reading individual sheets (readExpensesFromSheet, readIncomeFromSheet, etc.) and merges similarly.

## Data blob (V2)

Stored in a dedicated sheet (Data tab). Format: string `V2` + Base64(gzip(JSON(payload))). Payload keys: e, i, d, dp, r, pt, ec, ic, sc (see data-model.md). Built by **src/lib/minifiedPayload.ts** (serializeToBlob); parsed by parseFromBlob.

## Sheet names and layout

- **Expenses** — Columns: date, description, amount, category, source, cardMember (and id for legacy).
- **Mortgage** — Same structure as expenses; rows with category Mortgage.
- **Income** — Columns include date, description, amount, category, owner, recurring fields.
- **Debts** — id, name, initialAmount, startDate, owner, recurring fields.
- **DebtPayments** — id, debtId, date, amount, note.
- **Rules** — id, enabled, condition, action.
- **PresetTransactions** — id, source, description, category, cardMember.
- **Totals** — Monthly rows and TOTALS row.
- **Data** — Single cell or column containing the V2 blob string.

Exact column names and ranges are in **src/lib/googleSheets.ts** (constants and function parameters).
