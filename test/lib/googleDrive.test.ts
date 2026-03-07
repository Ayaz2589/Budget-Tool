import { beforeEach, expect, mock, test } from "bun:test";
import {
  createOrthoFolder,
  createSheetInFolder,
  findOrthoFolder,
  isSpreadsheetActive,
  listSheetsInFolder,
  findOrCreateOrthoSheet,
} from "@/lib/google/googleDrive";
import { TimeoutError } from "@/lib/platform/withTimeout";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  mock.restore();
  globalThis.fetch = originalFetch;
});

test("findOrthoFolder returns newest matching folder", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(
      JSON.stringify({
        files: [
          { id: "folder-new", name: "Ortho", modifiedTime: "2026-02-11T10:00:00Z" },
          { id: "folder-old", name: "Ortho", modifiedTime: "2026-01-10T10:00:00Z" },
        ],
      }),
      { status: 200 },
    ) as unknown as Response;
  }) as typeof fetch;

  const folder = await findOrthoFolder("token");
  expect(folder).toEqual({ id: "folder-new", name: "Ortho" });
});

test("listSheetsInFolder returns sheet files", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(
      JSON.stringify({
        files: [
          { id: "s1", name: "Ortho Budget", modifiedTime: "2026-02-11T10:00:00Z" },
        ],
      }),
      { status: 200 },
    ) as unknown as Response;
  }) as typeof fetch;

  const sheets = await listSheetsInFolder("token", "folder-1");
  expect(sheets).toEqual([
    { id: "s1", name: "Ortho Budget", modifiedTime: "2026-02-11T10:00:00Z" },
  ]);
});

test("createOrthoFolder creates folder", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(JSON.stringify({ id: "folder-1", name: "Ortho" }), {
      status: 200,
    }) as unknown as Response;
  }) as typeof fetch;

  const folder = await createOrthoFolder("token");
  expect(folder).toEqual({ id: "folder-1", name: "Ortho" });
});

test("createSheetInFolder creates sheet and moves it into folder", async () => {
  let call = 0;
  globalThis.fetch = mock(async (url: string) => {
    call += 1;
    if (call === 1) {
      expect(url).toContain("sheets.googleapis.com");
      return new Response(
        JSON.stringify({
          spreadsheetId: "sheet-1",
          properties: { title: "Ortho Budget" },
        }),
        { status: 200 },
      ) as unknown as Response;
    }
    if (call === 2) {
      expect(url).toContain("/drive/v3/files/sheet-1");
      return new Response(JSON.stringify({ parents: ["root"] }), {
        status: 200,
      }) as unknown as Response;
    }
    expect(url).toContain("addParents=folder-1");
    return new Response(JSON.stringify({ id: "sheet-1" }), {
      status: 200,
    }) as unknown as Response;
  }) as typeof fetch;

  const sheet = await createSheetInFolder("token", "folder-1", "Ortho Budget");
  expect(sheet).toEqual({ id: "sheet-1", name: "Ortho Budget" });
});

test("createOrthoFolder throws on API failure", async () => {
  globalThis.fetch = mock(async () => {
    return new Response("forbidden", { status: 403 }) as unknown as Response;
  }) as typeof fetch;

  await expect(createOrthoFolder("token")).rejects.toThrow("Drive API failed: 403");
});

test("findOrthoFolder returns null when no folders match", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(JSON.stringify({ files: [] }), {
      status: 200,
    }) as unknown as Response;
  }) as typeof fetch;

  const folder = await findOrthoFolder("token");
  expect(folder).toBeNull();
});

test("findOrthoFolder throws on 403 permission error", async () => {
  globalThis.fetch = mock(async () => {
    return new Response("forbidden", { status: 403 }) as unknown as Response;
  }) as typeof fetch;

  await expect(findOrthoFolder("token")).rejects.toThrow("Drive API failed: 403");
});

test("findOrthoFolder throws on 404", async () => {
  globalThis.fetch = mock(async () => {
    return new Response("not found", { status: 404 }) as unknown as Response;
  }) as typeof fetch;

  await expect(findOrthoFolder("token")).rejects.toThrow("Drive API failed: 404");
});

test("listSheetsInFolder throws on 403", async () => {
  globalThis.fetch = mock(async () => {
    return new Response("forbidden", { status: 403 }) as unknown as Response;
  }) as typeof fetch;

  await expect(listSheetsInFolder("token", "folder-1")).rejects.toThrow(
    "Drive API failed: 403",
  );
});

test("listSheetsInFolder returns empty array when no sheets exist", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(JSON.stringify({ files: [] }), {
      status: 200,
    }) as unknown as Response;
  }) as typeof fetch;

  const sheets = await listSheetsInFolder("token", "folder-1");
  expect(sheets).toEqual([]);
});

test("createSheetInFolder throws on Sheets API failure", async () => {
  globalThis.fetch = mock(async () => {
    return new Response("internal error", { status: 500 }) as unknown as Response;
  }) as typeof fetch;

  await expect(
    createSheetInFolder("token", "folder-1", "Test Sheet"),
  ).rejects.toThrow("Sheets API failed: 500");
});

test("isSpreadsheetActive returns false on network error", async () => {
  globalThis.fetch = mock(async () => {
    throw new Error("Network error");
  }) as typeof fetch;

  const active = await isSpreadsheetActive("token", "sheet-1");
  expect(active).toBe(false);
});

test("isSpreadsheetActive returns false when file is trashed", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(
      JSON.stringify({
        id: "sheet-1",
        mimeType: "application/vnd.google-apps.spreadsheet",
        trashed: true,
      }),
      { status: 200 },
    ) as unknown as Response;
  }) as typeof fetch;

  const active = await isSpreadsheetActive("token", "sheet-1");
  expect(active).toBe(false);
});

test("isSpreadsheetActive returns true for active spreadsheet", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(
      JSON.stringify({
        id: "sheet-1",
        mimeType: "application/vnd.google-apps.spreadsheet",
        trashed: false,
      }),
      { status: 200 },
    ) as unknown as Response;
  }) as typeof fetch;

  const active = await isSpreadsheetActive("token", "sheet-1");
  expect(active).toBe(true);
});

test("isSpreadsheetActive returns false for non-spreadsheet mime type", async () => {
  globalThis.fetch = mock(async () => {
    return new Response(
      JSON.stringify({
        id: "doc-1",
        mimeType: "application/vnd.google-apps.document",
        trashed: false,
      }),
      { status: 200 },
    ) as unknown as Response;
  }) as typeof fetch;

  const active = await isSpreadsheetActive("token", "doc-1");
  expect(active).toBe(false);
});
