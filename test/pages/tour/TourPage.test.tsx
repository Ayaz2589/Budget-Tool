import { beforeEach, expect, mock, test } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TourPage } from "@/pages/tour/TourPage";
import {
  GoogleAuthContext,
  RETURNING_USER_KEY,
  TOUR_COMPLETED_KEY,
} from "@/context/GoogleAuthContext";
import type { GoogleAuthContextValue } from "@/context/GoogleAuthContext";

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
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.removeItem(RETURNING_USER_KEY);
  localStorage.removeItem(TOUR_COMPLETED_KEY);
});

test("TourPage redirects signed-in users to dashboard", () => {
  renderWithAuth(baseAuth({ isSignedIn: true }));
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
});

test("TourPage allows stepping through tour and sign-in on final step", () => {
  const signIn = mock(() => {});
  renderWithAuth(baseAuth({ signIn }));

  expect(screen.getByText("Welcome to Ortho")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  expect(screen.getByText("Ready to Start")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

  expect(signIn).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(RETURNING_USER_KEY)).toBe("1");
  expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBe("1");
});

