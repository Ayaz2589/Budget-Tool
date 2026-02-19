/**
 * Data blob schema definition (single-cell read/write).
 */

import type { SheetSchema } from "@/lib/sheets-db";

export const dataBlobSchema: SheetSchema<string> = {
  sheetName: "Data",
  headers: ["Data"],
  readRange: "Data!A1",
  writeRange: "Data!A1",
  clearRange: "Data!A1:A1",
  appendSupported: false,

  parseRow(row) {
    const value = String(row[0] ?? "").trim();
    return value || null;
  },

  toRow(blob) {
    return [blob];
  },
};
