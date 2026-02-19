/**
 * Generic client factory for the Google Sheets database library.
 * Creates a schema-driven client with typed repositories.
 */

import type { SheetSchema, SheetsClientConfig, SheetsClient, Repository, InferEntity } from "./types";
import type { TransportContext } from "./transport";
import { extractSpreadsheetId, SHEETS_API, getSheetValues, updateSheet, clearRange } from "./transport";
import { schemaError, apiError } from "./errors";

export function createSheetsClient<
  S extends Record<string, SheetSchema<any>>,
>(config: SheetsClientConfig<S>): SheetsClient<S> {
  const ctx: TransportContext = {
    token: config.token,
    spreadsheetId: config.spreadsheetId,
  };
  const schemas = config.schemas;

  // Validate schemas at creation time
  const sheetNames = new Set<string>();
  for (const [key, schema] of Object.entries(schemas)) {
    if (!schema.sheetName) {
      throw schemaError(`Schema "${key}" has empty sheetName`);
    }
    if (!schema.headers || schema.headers.length === 0) {
      throw schemaError(`Schema "${key}" has empty headers`);
    }
    if (sheetNames.has(schema.sheetName)) {
      throw schemaError(`Duplicate sheetName "${schema.sheetName}" in schemas`);
    }
    sheetNames.add(schema.sheetName);
  }

  // Write mutex: serializes all write operations
  let writeLock: Promise<void> = Promise.resolve();

  function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = writeLock;
    let resolve: () => void;
    writeLock = new Promise<void>((r) => { resolve = r; });
    return prev.then(fn).finally(() => resolve!());
  }

  // Build a generic repository for a single schema
  function buildRepo<T>(schema: SheetSchema<T>): Repository<T> {
    return {
      async readAll(): Promise<T[]> {
        const rows = await getSheetValues(ctx, schema.readRange, "UNFORMATTED_VALUE");
        const results: T[] = [];
        for (let i = 0; i < rows.length; i++) {
          const entity = schema.parseRow(rows[i], i);
          if (entity != null) results.push(entity);
        }
        return results;
      },

      writeAll(records: T[]): Promise<void> {
        return withWriteLock(async () => {
          if (schema.validate) {
            for (const r of records) schema.validate(r);
          }
          const values: unknown[][] = [schema.headers];
          for (const r of records) values.push(schema.toRow(r));
          await clearRange(ctx, schema.clearRange);
          if (values.length > 0) {
            await updateSheet(ctx, schema.writeRange, values, false);
          }
        });
      },

      append(records: T[]): Promise<void> {
        if (!schema.appendSupported) {
          return Promise.reject(schemaError(`Append not supported for "${schema.sheetName}"`));
        }
        return withWriteLock(async () => {
          if (schema.validate) {
            for (const r of records) schema.validate(r);
          }
          const values = records.map((r) => schema.toRow(r));
          await updateSheet(ctx, schema.writeRange, values, true);
        });
      },
    };
  }

  // Pre-build all repositories
  const repos: Record<string, Repository<unknown>> = {};
  for (const [key, schema] of Object.entries(schemas)) {
    repos[key] = buildRepo(schema);
  }

  return {
    repo<K extends keyof S & string>(key: K): Repository<InferEntity<S[K]>> {
      return repos[key] as Repository<InferEntity<S[K]>>;
    },

    batchSync(payload): Promise<void> {
      return withWriteLock(async () => {
        const clearRanges: string[] = [];
        const data: { range: string; values: unknown[][] }[] = [];

        for (const [key, schema] of Object.entries(schemas)) {
          clearRanges.push(schema.clearRange);
          const records = (payload as Record<string, unknown[]>)[key] ?? [];
          const values: unknown[][] = [schema.headers];
          for (const r of records) {
            values.push((schema as SheetSchema<any>).toRow(r));
          }
          data.push({ range: schema.writeRange, values });
        }

        // Step 1: batchClear all ranges
        const clearRes = await fetch(
          `${SHEETS_API}/${ctx.spreadsheetId}/values:batchClear`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ctx.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ranges: clearRanges }),
          },
        );
        if (!clearRes.ok) {
          const body = await clearRes.text();
          throw apiError(`Batch clear failed: ${clearRes.status} ${body}`);
        }

        // Step 2: batchUpdate all data
        const updateRes = await fetch(
          `${SHEETS_API}/${ctx.spreadsheetId}/values:batchUpdate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ctx.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data, valueInputOption: "USER_ENTERED" }),
          },
        );
        if (!updateRes.ok) {
          const body = await updateRes.text();
          throw apiError(`Batch update failed: ${updateRes.status} ${body}`);
        }
      });
    },

    async ensureSchema(): Promise<void> {
      const metaUrl = `${SHEETS_API}/${ctx.spreadsheetId}?fields=sheets.properties(sheetId,title)`;
      const res = await fetch(metaUrl, {
        headers: { Authorization: `Bearer ${ctx.token}` },
      });
      if (!res.ok) throw schemaError("Failed to get spreadsheet metadata");
      const data = (await res.json()) as {
        sheets?: { properties: { sheetId: number; title: string } }[];
      };
      const titles = new Set((data.sheets ?? []).map((s) => s.properties.title));
      const toAdd = Object.values(schemas)
        .map((s) => s.sheetName)
        .filter((t) => !titles.has(t));
      if (toAdd.length === 0) return;

      const addRes = await fetch(`${SHEETS_API}/${ctx.spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: toAdd.map((title) => ({
            addSheet: { properties: { title } },
          })),
        }),
      });
      if (!addRes.ok) {
        const err = await addRes.text();
        throw schemaError(`Failed to add sheets: ${addRes.status} ${err}`);
      }
    },

    async applyFormatting(): Promise<void> {
      // Check if any schema has formatting rules
      const hasAnyFormatting = Object.values(schemas).some(
        (s) => (s.formatting && s.formatting.length > 0) || s.headerFormatting,
      );
      if (!hasAnyFormatting) return;

      // Fetch sheet metadata to get sheetIds
      const metaUrl = `${SHEETS_API}/${ctx.spreadsheetId}?fields=sheets.properties(sheetId,title)`;
      const metaRes = await fetch(metaUrl, {
        headers: { Authorization: `Bearer ${ctx.token}` },
      });
      if (!metaRes.ok) throw apiError("Failed to get spreadsheet metadata for formatting");
      const metaData = (await metaRes.json()) as {
        sheets?: { properties: { sheetId: number; title: string } }[];
      };
      const sheetIdMap = new Map<string, number>();
      for (const s of metaData.sheets ?? []) {
        sheetIdMap.set(s.properties.title, s.properties.sheetId);
      }

      const requests: Record<string, unknown>[] = [];

      for (const schema of Object.values(schemas)) {
        const sheetId = sheetIdMap.get(schema.sheetName);
        if (sheetId == null) continue;

        // Header formatting
        if (schema.headerFormatting) {
          const hf = schema.headerFormatting;
          const cellFormat: Record<string, unknown> = {};
          const fields: string[] = [];

          if (hf.bold || hf.fontSize) {
            cellFormat.textFormat = {
              ...(hf.bold != null ? { bold: hf.bold } : {}),
              ...(hf.fontSize != null ? { fontSize: hf.fontSize } : {}),
            };
            fields.push("userEnteredFormat.textFormat");
          }
          if (hf.horizontalAlignment) {
            cellFormat.horizontalAlignment = hf.horizontalAlignment;
            fields.push("userEnteredFormat.horizontalAlignment");
          }

          if (fields.length > 0) {
            requests.push({
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: schema.headers.length,
                },
                cell: { userEnteredFormat: cellFormat },
                fields: fields.join(","),
              },
            });
          }
        }

        // Data formatting rules
        if (schema.formatting) {
          for (const rule of schema.formatting) {
            const cellFormat: Record<string, unknown> = {};
            const fields: string[] = [];

            if (rule.bold || rule.fontSize) {
              cellFormat.textFormat = {
                ...(rule.bold != null ? { bold: rule.bold } : {}),
                ...(rule.fontSize != null ? { fontSize: rule.fontSize } : {}),
              };
              fields.push("userEnteredFormat.textFormat");
            }
            if (rule.horizontalAlignment) {
              cellFormat.horizontalAlignment = rule.horizontalAlignment;
              fields.push("userEnteredFormat.horizontalAlignment");
            }
            if (rule.numberFormat) {
              cellFormat.numberFormat = rule.numberFormat;
              fields.push("userEnteredFormat.numberFormat");
            }

            if (fields.length > 0) {
              requests.push({
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: rule.startRow ?? 1,
                    endRowIndex: rule.endRow ?? 10000,
                    startColumnIndex: rule.startCol,
                    endColumnIndex: rule.endCol,
                  },
                  cell: { userEnteredFormat: cellFormat },
                  fields: fields.join(","),
                },
              });
            }
          }
        }
      }

      if (requests.length === 0) return;

      const fmtRes = await fetch(`${SHEETS_API}/${ctx.spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      });
      if (!fmtRes.ok) {
        const body = await fmtRes.text();
        throw apiError(`Failed to apply formatting: ${fmtRes.status} ${body}`);
      }
    },

    extractSpreadsheetId,
  } as SheetsClient<S>;
}
