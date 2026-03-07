import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { render, screen, act, cleanup } from "@testing-library/react";
import { SheetSetupProvider, useSheetSetup } from "@/context/SheetSetupContext";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";

// ---------------------------------------------------------------------------
// Test consumer
// ---------------------------------------------------------------------------

function Consumer() {
  const ctx = useSheetSetup();
  return (
    <div>
      <span data-testid="spreadsheet-id">{ctx.spreadsheetId ?? "null"}</span>
      <span data-testid="setup-state">{ctx.sheetSetupState}</span>
      <span data-testid="sheets-count">{ctx.availableDriveSheets.length}</span>
      <button data-testid="set-id" onClick={() => ctx.setSpreadsheetId("new-id-789")} />
      <button data-testid="clear-id" onClick={() => ctx.setSpreadsheetId(null)} />
      <button
        data-testid="set-url"
        onClick={() =>
          ctx.setSpreadsheetId(
            "https://docs.google.com/spreadsheets/d/url-extracted-id/edit#gid=0",
          )
        }
      />
      <button data-testid="link" onClick={() => ctx.linkDriveSheet("linked-sheet-id")} />
      <button data-testid="dismiss" onClick={() => ctx.dismissSheetSetupPrompt()} />
      <button
        data-testid="consume-flag"
        onClick={() => {
          const flag = ctx.consumeInitialSyncFlag();
          document.getElementById("flag-result")!.textContent = String(flag);
        }}
      />
      <span id="flag-result" data-testid="flag-result" />
    </div>
  );
}

function renderWithProvider(accessToken: string | null = null) {
  return render(
    <SheetSetupProvider accessToken={accessToken}>
      <Consumer />
    </SheetSetupProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SheetSetupContext", () => {
  beforeEach(() => {
    storage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
  });

  afterEach(() => {
    cleanup();
    storage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
  });

  test("defaults to null spreadsheetId when storage is empty", () => {
    renderWithProvider();
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("null");
  });

  test("reads spreadsheetId from storage on mount", () => {
    storage.setItem(STORAGE_KEYS.SPREADSHEET_ID, "persisted-id");
    renderWithProvider();
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("persisted-id");
  });

  test("defaults to idle sheetSetupState", () => {
    renderWithProvider();
    expect(screen.getByTestId("setup-state").textContent).toBe("idle");
  });

  test("defaults to 0 availableDriveSheets", () => {
    renderWithProvider();
    expect(screen.getByTestId("sheets-count").textContent).toBe("0");
  });

  test("setSpreadsheetId updates ID and transitions to done", () => {
    renderWithProvider();
    act(() => {
      screen.getByTestId("set-id").click();
    });
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("new-id-789");
    expect(screen.getByTestId("setup-state").textContent).toBe("done");
  });

  test("setSpreadsheetId persists to storage", () => {
    renderWithProvider();
    act(() => {
      screen.getByTestId("set-id").click();
    });
    expect(storage.getItem(STORAGE_KEYS.SPREADSHEET_ID)).toBe("new-id-789");
  });

  test("setSpreadsheetId extracts ID from full Google Sheets URL", () => {
    renderWithProvider();
    act(() => {
      screen.getByTestId("set-url").click();
    });
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("url-extracted-id");
  });

  test("clearing spreadsheetId resets state to idle", () => {
    renderWithProvider();
    // First set an ID
    act(() => {
      screen.getByTestId("set-id").click();
    });
    expect(screen.getByTestId("setup-state").textContent).toBe("done");

    // Then clear it
    act(() => {
      screen.getByTestId("clear-id").click();
    });
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("null");
    expect(screen.getByTestId("setup-state").textContent).toBe("idle");
  });

  test("clearing spreadsheetId removes from storage", () => {
    storage.setItem(STORAGE_KEYS.SPREADSHEET_ID, "to-remove");
    renderWithProvider();
    act(() => {
      screen.getByTestId("clear-id").click();
    });
    expect(storage.getItem(STORAGE_KEYS.SPREADSHEET_ID)).toBeNull();
  });

  test("linkDriveSheet sets spreadsheetId and transitions to done", () => {
    renderWithProvider();
    act(() => {
      screen.getByTestId("link").click();
    });
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("linked-sheet-id");
    expect(screen.getByTestId("setup-state").textContent).toBe("done");
  });

  test("dismissSheetSetupPrompt resets state to idle", () => {
    renderWithProvider();
    act(() => {
      screen.getByTestId("dismiss").click();
    });
    expect(screen.getByTestId("setup-state").textContent).toBe("idle");
    expect(screen.getByTestId("sheets-count").textContent).toBe("0");
  });

  test("consumeInitialSyncFlag returns false by default", () => {
    renderWithProvider();
    act(() => {
      screen.getByTestId("consume-flag").click();
    });
    expect(screen.getByTestId("flag-result").textContent).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// useSheetSetup hook
// ---------------------------------------------------------------------------

describe("useSheetSetup", () => {
  afterEach(() => {
    cleanup();
  });

  test("throws when used outside provider", () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      function Bad() {
        useSheetSetup();
        return null;
      }
      render(<Bad />);
    }).toThrow("useSheetSetup must be used within SheetSetupProvider");
    spy.mockRestore();
  });
});
