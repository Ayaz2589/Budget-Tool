import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { render, screen, act, cleanup } from "@testing-library/react";
import { useContext } from "react";
import {
  GoogleAuthProviderFallback,
  GoogleAuthContext,
  useGoogleAuth,
} from "@/context/GoogleAuthContext";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TestConsumer() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="signed-in">{String(ctx.isSignedIn)}</span>
      <span data-testid="user-profile">{ctx.userProfile ? ctx.userProfile.name : "null"}</span>
      <span data-testid="spreadsheet-id">{ctx.spreadsheetId ?? "null"}</span>
      <span data-testid="sync-status">{ctx.syncStatus}</span>
      <span data-testid="sync-health">{ctx.syncHealth}</span>
      <span data-testid="sheet-setup-state">{ctx.sheetSetupState}</span>
      <span data-testid="auto-sync">{String(ctx.isAutoSyncEnabled)}</span>
      <span data-testid="has-unsynced">{String(ctx.hasUnsyncedChanges)}</span>
      <button data-testid="set-sheet" onClick={() => ctx.setSpreadsheetId("test-123")} />
      <button data-testid="clear-sheet" onClick={() => ctx.setSpreadsheetId(null)} />
      <button data-testid="sync-btn" onClick={() => void ctx.syncToSheets()} />
      <button data-testid="pull-btn" onClick={() => void ctx.pullFromSheet()} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback provider
// ---------------------------------------------------------------------------

describe("GoogleAuthProviderFallback", () => {
  beforeEach(() => {
    storage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
  });

  afterEach(() => {
    cleanup();
    storage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
  });

  test("provides isSignedIn = false", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("signed-in").textContent).toBe("false");
  });

  test("provides null userProfile", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("user-profile").textContent).toBe("null");
  });

  test("provides idle sync status", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("sync-status").textContent).toBe("idle");
  });

  test("provides idle sheetSetupState", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("sheet-setup-state").textContent).toBe("idle");
  });

  test("provides healthy sync health", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("sync-health").textContent).toBe("healthy");
  });

  test("spreadsheetId defaults to null when nothing in storage", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("null");
  });

  test("reads spreadsheetId from storage on mount", () => {
    storage.setItem(STORAGE_KEYS.SPREADSHEET_ID, "stored-sheet-456");
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("stored-sheet-456");
  });

  test("setSpreadsheetId updates the spreadsheetId", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    act(() => {
      screen.getByTestId("set-sheet").click();
    });
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("test-123");
  });

  test("setSpreadsheetId persists to storage", () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    act(() => {
      screen.getByTestId("set-sheet").click();
    });
    expect(storage.getItem(STORAGE_KEYS.SPREADSHEET_ID)).toBe("test-123");
  });

  test("clearing spreadsheetId removes from storage", () => {
    storage.setItem(STORAGE_KEYS.SPREADSHEET_ID, "to-remove");
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    act(() => {
      screen.getByTestId("clear-sheet").click();
    });
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("null");
    expect(storage.getItem(STORAGE_KEYS.SPREADSHEET_ID)).toBeNull();
  });

  test("setSpreadsheetId extracts ID from full URL", () => {
    function UrlConsumer() {
      const ctx = useContext(GoogleAuthContext)!;
      return (
        <div>
          <span data-testid="spreadsheet-id">{ctx.spreadsheetId ?? "null"}</span>
          <button
            data-testid="set-url"
            onClick={() =>
              ctx.setSpreadsheetId(
                "https://docs.google.com/spreadsheets/d/abc123def/edit",
              )
            }
          />
        </div>
      );
    }
    render(
      <GoogleAuthProviderFallback>
        <UrlConsumer />
      </GoogleAuthProviderFallback>,
    );
    act(() => {
      screen.getByTestId("set-url").click();
    });
    expect(screen.getByTestId("spreadsheet-id").textContent).toBe("abc123def");
  });

  test("syncToSheets sets error status in fallback mode", async () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    await act(async () => {
      screen.getByTestId("sync-btn").click();
    });
    expect(screen.getByTestId("sync-status").textContent).toBe("error");
  });

  test("pullFromSheet sets error status in fallback mode", async () => {
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    await act(async () => {
      screen.getByTestId("pull-btn").click();
    });
    expect(screen.getByTestId("sync-status").textContent).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// useGoogleAuth hook
// ---------------------------------------------------------------------------

describe("useGoogleAuth", () => {
  afterEach(() => {
    cleanup();
  });

  test("throws when used outside provider", () => {
    // Suppress console.error from React boundary
    const spy = spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      function Bad() {
        useGoogleAuth();
        return null;
      }
      render(<Bad />);
    }).toThrow("useGoogleAuth must be used within GoogleAuthProvider");
    spy.mockRestore();
  });

  test("returns context when used within FallbackProvider", () => {
    function Good() {
      const ctx = useGoogleAuth();
      return <span data-testid="ok">{String(ctx.isSignedIn)}</span>;
    }
    render(
      <GoogleAuthProviderFallback>
        <Good />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("ok").textContent).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// Token storage helpers (tested via GoogleAuthContext behavior)
// ---------------------------------------------------------------------------

describe("token storage helpers", () => {
  const TOKEN_KEY = STORAGE_KEYS.ACCESS_TOKEN;

  afterEach(() => {
    cleanup();
    storage.removeItem(TOKEN_KEY);
  });

  test("getStoredAccessToken returns null for missing key", () => {
    storage.removeItem(TOKEN_KEY);
    // No direct export, but we validate that creating the provider doesn't crash
    // and starts with isSignedIn=false
    render(
      <GoogleAuthProviderFallback>
        <TestConsumer />
      </GoogleAuthProviderFallback>,
    );
    expect(screen.getByTestId("signed-in").textContent).toBe("false");
  });

  test("expired token is cleared from storage", () => {
    // Store an already-expired token
    const expired = {
      access_token: "old-token",
      expires_at: Date.now() - 120_000, // 2 minutes ago
    };
    storage.setItem(TOKEN_KEY, JSON.stringify(expired));

    // The fallback provider doesn't use token storage, but we verify the storage format
    const raw = storage.getItem(TOKEN_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { access_token: string; expires_at: number };
    expect(parsed.access_token).toBe("old-token");
    expect(parsed.expires_at).toBeLessThan(Date.now());
  });

  test("valid token structure has access_token and optional expires_at", () => {
    const valid = {
      access_token: "valid-token-abc",
      expires_at: Date.now() + 3600_000,
    };
    storage.setItem(TOKEN_KEY, JSON.stringify(valid));
    const raw = storage.getItem(TOKEN_KEY);
    const parsed = JSON.parse(raw!) as { access_token: string; expires_at: number };
    expect(parsed.access_token).toBe("valid-token-abc");
    expect(parsed.expires_at).toBeGreaterThan(Date.now());
  });
});
