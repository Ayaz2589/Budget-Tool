import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BudgetProvider } from "@/context";
import { GoogleAuthContext } from "@/context";
import type { GoogleAuthContextValue } from "@/types/auth";
import { Layout } from "@/components/Layout";

const originalMatchMedia = window.matchMedia;

function setViewportMode(mode: "desktop" | "mobile") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => {
      const isMinDesktop = query.includes("min-width: 768px");
      const isMaxMobile = query.includes("max-width: 767px");
      const matches =
        mode === "desktop"
          ? isMinDesktop
          : isMaxMobile;
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      };
    },
  });
}

function buildAuthValue(
  overrides: Partial<GoogleAuthContextValue> = {},
): GoogleAuthContextValue {
  return {
    isSignedIn: false,
    userProfile: null,
    signIn: () => {},
    signOut: () => {},
    spreadsheetId: null,
    setSpreadsheetId: () => {},
    syncToSheets: async () => {},
    pullFromSheet: async () => {},
    syncStatus: "idle",
    syncErrorMessage: null,
    isAutoSyncEnabled: false,
    setAutoSyncEnabled: () => {},
    lastSyncAt: null,
    hasUnsyncedChanges: false,
    syncHealth: "healthy",
    sheetSetupState: "idle",
    availableDriveSheets: [],
    runSheetAutoSetup: async () => {},
    linkDriveSheet: () => {},
    createOrthoDriveSheet: async () => {},
    dismissSheetSetupPrompt: () => {},
    ...overrides,
  };
}

function renderLayout(
  authOverrides: Partial<GoogleAuthContextValue> = {},
  route = "/dashboard",
) {
  return render(
    <BudgetProvider>
      <GoogleAuthContext.Provider value={buildAuthValue(authOverrides)}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<div>Dashboard content</div>} />
              <Route path="transactions" element={<div>Transactions content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </GoogleAuthContext.Provider>
    </BudgetProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.removeItem("budget-tool-help-hint-seen");
  localStorage.removeItem("budget-tool-ui-format");
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: originalMatchMedia,
  });
});

test("Layout renders branding, nav, and routed content", () => {
  renderLayout();
  expect(screen.getAllByText("Ortho").length).toBeGreaterThanOrEqual(1);
  expect(
    screen.getAllByRole("link", { name: /dashboard/i }).length,
  ).toBeGreaterThanOrEqual(1);
  expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /more/i })).toBeInTheDocument();
});

test("Layout opens More sheet and shows additional nav links", () => {
  renderLayout();
  fireEvent.click(screen.getByRole("button", { name: "More" }));
  expect(screen.getByRole("link", { name: "Debt" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
});

test("Layout shows sync indicator on non-dashboard routes when unsynced", () => {
  renderLayout(
    {
      isSignedIn: true,
      spreadsheetId: "sheet-id",
      hasUnsyncedChanges: true,
      syncStatus: "idle",
    },
    "/dashboard/transactions",
  );
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.getByText("Sync pending")).toBeInTheDocument();
});

test("Layout calls signOut from More sheet and supports avatar fallback", () => {
  const signOut = mock(() => {});
  const { container } = renderLayout({
    isSignedIn: true,
    userProfile: {
      name: "Ayaz Uddin",
      picture: "https://example.com/avatar.png",
      email: "ayaz@example.com",
    },
    signOut,
  });

  const avatar = container.querySelector("img");
  expect(avatar).not.toBeNull();
  fireEvent.error(avatar!);
  expect(screen.getByText("AU")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "More" }));
  const signOutButtons = screen.getAllByRole("button", { name: "Sign out" });
  fireEvent.click(signOutButtons[signOutButtons.length - 1]!);
  expect(signOut).toHaveBeenCalledTimes(1);
});

test("Layout shows sheet setup dialog when signed in without linked spreadsheet", () => {
  const dismissSheetSetupPrompt = mock(() => {});
  renderLayout({
    isSignedIn: true,
    spreadsheetId: null,
    sheetSetupState: "needs-create",
    dismissSheetSetupPrompt,
  });

  expect(screen.getByText("Link a Google Sheet")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Not now" }));
  expect(dismissSheetSetupPrompt).toHaveBeenCalledTimes(1);
});

test("Layout shows help hint after sheet setup flow is resolved for first-time users", async () => {
  localStorage.removeItem("budget-tool-help-hint-seen");
  const { rerender } = render(
    <BudgetProvider>
      <GoogleAuthContext.Provider
        value={buildAuthValue({
          isSignedIn: true,
          spreadsheetId: null,
          sheetSetupState: "needs-selection",
          availableDriveSheets: [{ id: "sheet-1", name: "Ortho Budget" }],
        })}
      >
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<div>Dashboard content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </GoogleAuthContext.Provider>
    </BudgetProvider>,
  );

  expect(screen.getByText("Link a Google Sheet")).toBeInTheDocument();
  expect(screen.queryByText("Need help in the app?")).not.toBeInTheDocument();

  rerender(
    <BudgetProvider>
      <GoogleAuthContext.Provider
        value={buildAuthValue({
          isSignedIn: true,
          spreadsheetId: "sheet-1",
          sheetSetupState: "done",
        })}
      >
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<div>Dashboard content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </GoogleAuthContext.Provider>
    </BudgetProvider>,
  );

  await waitFor(() => {
    expect(screen.getByText("Need help in the app?")).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument();
});

test("Layout shows FX fallback warning when rate is 1 and fxFallback is true for non-USD currency", () => {
  localStorage.setItem(
    "budget-tool-ui-format",
    JSON.stringify({
      locale: "en-US",
      currency: "EUR",
      baseCurrency: "USD",
      fxRate: 1,
      fxFallback: true,
      dateFormat: "YYYY/MM/DD",
    }),
  );
  renderLayout();
  expect(screen.getByText(/currency conversion unavailable/i)).toBeInTheDocument();
});

test("Layout does not show FX warning when currency is USD", () => {
  localStorage.setItem(
    "budget-tool-ui-format",
    JSON.stringify({
      locale: "en-US",
      currency: "USD",
      baseCurrency: "USD",
      fxRate: 1,
      fxFallback: false,
      dateFormat: "YYYY/MM/DD",
    }),
  );
  renderLayout();
  expect(screen.queryByText(/currency conversion unavailable/i)).not.toBeInTheDocument();
});

test("Layout does not show FX warning when fxFallback is true but rate is not 1", () => {
  localStorage.setItem(
    "budget-tool-ui-format",
    JSON.stringify({
      locale: "en-US",
      currency: "EUR",
      baseCurrency: "USD",
      fxRate: 0.92,
      fxFallback: true,
      dateFormat: "YYYY/MM/DD",
    }),
  );
  renderLayout();
  expect(screen.queryByText(/currency conversion unavailable/i)).not.toBeInTheDocument();
});
