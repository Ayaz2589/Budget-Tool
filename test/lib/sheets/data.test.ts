import { test, expect, describe } from "bun:test";
import { writeDataBlob, readDataBlob, writeSyncTimestamp, readSyncTimestamp } from "@/lib/sheets/data";
import type { SheetsClient } from "@/lib/sheets/client";

function makeMockClient(readResult: unknown[][] = []): SheetsClient {
  return {
    raw: {
      writeRange: async (_range: string, _values: unknown[][]) => {},
      readRange: async (_range: string, _format?: string) => readResult,
    },
  } as unknown as SheetsClient;
}

describe("writeDataBlob", () => {
  test("calls writeRange with correct range and blob", async () => {
    let capturedRange = "";
    let capturedValues: unknown[][] = [];

    const client = {
      raw: {
        writeRange: async (range: string, values: unknown[][]) => {
          capturedRange = range;
          capturedValues = values;
        },
        readRange: async () => [],
      },
    } as unknown as SheetsClient;

    await writeDataBlob(client, "test-blob-data");

    expect(capturedRange).toBe("Data!A1");
    expect(capturedValues).toEqual([["test-blob-data"]]);
  });
});

describe("readDataBlob", () => {
  test("returns string from A1 cell", async () => {
    const client = makeMockClient([["some-blob-content"]]);
    const result = await readDataBlob(client);
    expect(result).toBe("some-blob-content");
  });

  test("returns null when cell is empty string", async () => {
    const client = makeMockClient([[""]]);
    const result = await readDataBlob(client);
    expect(result).toBeNull();
  });

  test("returns null when no rows returned", async () => {
    const client = makeMockClient([]);
    const result = await readDataBlob(client);
    expect(result).toBeNull();
  });

  test("returns null when row has no columns", async () => {
    const client = makeMockClient([[]]);
    const result = await readDataBlob(client);
    expect(result).toBeNull();
  });

  test("trims whitespace from value", async () => {
    const client = makeMockClient([["  trimmed-value  "]]);
    const result = await readDataBlob(client);
    expect(result).toBe("trimmed-value");
  });
});

describe("writeSyncTimestamp", () => {
  test("writes timestamp to Data!B1", async () => {
    let capturedRange = "";
    let capturedValues: unknown[][] = [];

    const client = {
      raw: {
        writeRange: async (range: string, values: unknown[][]) => {
          capturedRange = range;
          capturedValues = values;
        },
        readRange: async () => [],
      },
    } as unknown as SheetsClient;

    await writeSyncTimestamp(client, 1709827200000);

    expect(capturedRange).toBe("Data!B1");
    expect(capturedValues).toEqual([[1709827200000]]);
  });
});

describe("readSyncTimestamp", () => {
  test("reads timestamp from Data!B1", async () => {
    const client = makeMockClient([[1709827200000]]);
    const result = await readSyncTimestamp(client);
    expect(result).toBe(1709827200000);
  });

  test("returns null for empty cell", async () => {
    const client = makeMockClient([]);
    const result = await readSyncTimestamp(client);
    expect(result).toBeNull();
  });

  test("returns null for empty row", async () => {
    const client = makeMockClient([[]]);
    const result = await readSyncTimestamp(client);
    expect(result).toBeNull();
  });

  test("returns null for non-numeric value", async () => {
    const client = makeMockClient([["not-a-number"]]);
    const result = await readSyncTimestamp(client);
    expect(result).toBeNull();
  });

  test("returns null for Infinity", async () => {
    const client = makeMockClient([[Infinity]]);
    const result = await readSyncTimestamp(client);
    expect(result).toBeNull();
  });
});
