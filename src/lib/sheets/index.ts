/**
 * Google Sheets integration — barrel re-exports.
 *
 * Domain sheets are handled by genjutsu-db models (see models.ts and client.ts).
 * This barrel re-exports the remaining modules: Data blob, Totals, and the
 * genjutsu-db client factory.
 */

// genjutsu-db client
export { createSheetsClient, type SheetsClient } from "./client";

// Models (app-specific validation + genjutsu-db model definitions)
export { validateExpenseSource } from "./models";

// Data blob (special-case sheet not covered by models)
export { writeDataBlob, readDataBlob } from "./data";

// Totals (dynamic columns not covered by models)
export { writeTotalsSheet, buildTotalsValues } from "./totals";
