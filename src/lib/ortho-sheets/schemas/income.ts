/**
 * Income schema definition using the generic SheetSchema<T> interface.
 */

import type { SheetSchema } from "@/lib/sheets-db";
import { normalizeDate, parseAmount, generateId } from "@/lib/sheets-db";
import type { Income } from "../types";
import { normalizeCategoryFromSheet, parseOwner, validateIncome } from "../normalize";
import { INCOME_FORMATTING, ORTHO_HEADER_FORMAT } from "../formatting";

export const incomeSchema: SheetSchema<Income> = {
  sheetName: "Income",
  headers: ["Date", "Amount", "Description", "Category", "Owner"],
  readRange: "Income!A2:E",
  writeRange: "Income!A1:E",
  clearRange: "Income!A1:I10000",
  appendSupported: true,

  parseRow(row) {
    const date = normalizeDate(row[0]);
    const amount = parseAmount(row[1]);
    const description = String(row[2] ?? "").trim();
    const category = normalizeCategoryFromSheet(String(row[3] ?? ""));
    const owner =
      row.length >= 5 && (row[4] ?? "").toString().trim()
        ? parseOwner(row[4])
        : undefined;

    if (!date || amount == null || amount <= 0) return null;
    return {
      id: generateId(),
      date,
      amount,
      description: description || "Income",
      category: category || "",
      owner,
    };
  },

  toRow(income) {
    return [
      income.date,
      income.amount,
      income.description,
      income.category || "Uncategorized",
      income.owner ?? "",
    ];
  },

  validate: validateIncome,
  formatting: INCOME_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};
