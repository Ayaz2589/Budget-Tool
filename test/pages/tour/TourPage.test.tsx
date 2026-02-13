import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TourPage } from "@/pages/tour/TourPage";
import {
  GoogleAuthContext,
  RETURNING_USER_KEY,
  TOUR_COMPLETED_KEY,
} from "@/context";
import type { GoogleAuthContextValue } from "@/context";

function renderWithAuth(value: GoogleAuthContextValue) {
  return render(
    <GoogleAuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/tour"]}>
        <Routes>
          <Route path="/tour" element={<TourPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );
}

function baseAuth(overrides: Partial<GoogleAuthContextValue> = {}): GoogleAuthContextValue {
  return {
    isSignedIn: false,
    signIn: () => {},
    signOut: () => {},
    userProfile: null,
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

beforeEach(() => {
  localStorage.removeItem(RETURNING_USER_KEY);
  localStorage.removeItem(TOUR_COMPLETED_KEY);
});

afterEach(() => {
  cleanup();
});

test("TourPage redirects signed-in users to dashboard", () => {
  renderWithAuth(baseAuth({ isSignedIn: true }));
  expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
});

test("TourPage allows signed-in replay mode", async () => {
  render(
    <GoogleAuthContext.Provider value={baseAuth({ isSignedIn: true })}>
      <MemoryRouter initialEntries={["/tour?replay=1"]}>
        <Routes>
          <Route path="/tour" element={<TourPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );

  expect(
    screen.getByText("What language do you want to use Ortho?"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");
  for (let i = 0; i < 10; i += 1) {
    if (screen.queryByRole("button", { name: "Finish tour" })) break;
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    // allow animated card transitions to complete
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  expect(screen.getByRole("button", { name: "Finish tour" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "Your account is already connected. You can finish this walkthrough and continue to your dashboard.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Sign in with Google" }),
  ).not.toBeInTheDocument();
});

test("TourPage allows stepping through tour and sign-in on final step", async () => {
  const signIn = mock(() => {});
  renderWithAuth(baseAuth({ signIn }));

  expect(
    screen.getByText("What language do you want to use Ortho?"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");
  for (let i = 0; i < 10; i += 1) {
    if (screen.queryByRole("button", { name: "Sign in with Google" })) break;
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  expect(
    screen.getByRole("button", { name: "Sign in with Google" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Ready to Start")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

  expect(signIn).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(RETURNING_USER_KEY)).toBe("1");
  expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBe("1");
});

test("TourPage language selector changes tour copy", async () => {
  renderWithAuth(baseAuth());
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByText("Español"));
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  expect(await screen.findByText("Bienvenido a Ortho")).toBeInTheDocument();
});
