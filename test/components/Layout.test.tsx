import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  localStorage.setItem("budget-tool-app-tour-completed", "1");
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: originalMatchMedia,
  });
});

test("Layout shows desktop app tour on first dashboard visit", () => {
  setViewportMode("desktop");
  localStorage.removeItem("budget-tool-app-tour-completed");
  renderLayout({ isSignedIn: true, spreadsheetId: "sheet-id" });
  expect(screen.getByText("App Tour 1/24")).toBeInTheDocument();
  expect(screen.getByText("Dashboard overview")).toBeInTheDocument();
});

test("Layout shows app tour on first dashboard visit in mobile", () => {
  setViewportMode("mobile");
  localStorage.removeItem("budget-tool-app-tour-completed");
  renderLayout({ isSignedIn: true, spreadsheetId: "sheet-id" });
  expect(screen.getByText("App Tour 1/10")).toBeInTheDocument();
  expect(screen.getByText("Dashboard overview")).toBeInTheDocument();
});

test("Layout mobile tour advances to next step without getting stuck", () => {
  setViewportMode("mobile");
  localStorage.removeItem("budget-tool-app-tour-completed");
  renderLayout({ isSignedIn: true, spreadsheetId: "sheet-id" });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("App Tour 2/10")).toBeInTheDocument();
  expect(screen.getByText("Dashboard settings sheet")).toBeInTheDocument();
});

test("Layout waits for sheet setup decision before starting first-run app tour", () => {
  setViewportMode("desktop");
  localStorage.removeItem("budget-tool-app-tour-completed");
  const { rerender } = render(
    <BudgetProvider>
      <GoogleAuthContext.Provider
        value={buildAuthValue({
          isSignedIn: true,
          spreadsheetId: null,
          sheetSetupState: "needs-create",
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

  expect(screen.queryByText("App Tour 1/24")).not.toBeInTheDocument();
  expect(screen.getByText("Link a Google Sheet")).toBeInTheDocument();

  rerender(
    <BudgetProvider>
      <GoogleAuthContext.Provider
        value={buildAuthValue({
          isSignedIn: true,
          spreadsheetId: null,
          sheetSetupState: "idle",
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

  expect(screen.getByText("App Tour 1/24")).toBeInTheDocument();
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
