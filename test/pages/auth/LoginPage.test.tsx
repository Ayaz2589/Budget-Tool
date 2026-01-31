import { test, expect } from "bun:test";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { LoginPage } from "@/pages/auth/LoginPage";
import { GoogleAuthContext, GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import type { GoogleAuthContextValue } from "@/context/GoogleAuthContext";

const mockAuthValue: GoogleAuthContextValue = {
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
};

test("LoginPage renders app name, heading, and sign-in button", () => {
  const { container } = render(
    <GoogleAuthProviderFallback>
      <LoginPage />
    </GoogleAuthProviderFallback>,
  );
  const scope = within(container);
  expect(scope.getByText("Ortho")).toBeInTheDocument();
  expect(scope.getByText("Create your Ortho account")).toBeInTheDocument();
  expect(scope.getByRole("button", { name: /google/i })).toBeInTheDocument();
});

test("LoginPage sign-in button calls signIn when clicked", () => {
  let called = false;
  const signIn = () => {
    called = true;
  };
  const { container } = render(
    <GoogleAuthContext.Provider value={{ ...mockAuthValue, signIn }}>
      <LoginPage />
    </GoogleAuthContext.Provider>,
  );
  const button = within(container).getByRole("button", { name: /google/i });
  fireEvent.click(button);
  expect(called).toBe(true);
});
