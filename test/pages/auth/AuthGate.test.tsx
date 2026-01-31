import { test, expect } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthGate, AuthLoginRoute } from "@/pages/auth/AuthGate";
import { GoogleAuthContext, GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import type { GoogleAuthContextValue } from "@/context/GoogleAuthContext";

const mockAuthValueSignedOut: GoogleAuthContextValue = {
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

const mockAuthValueSignedIn: GoogleAuthContextValue = {
  ...mockAuthValueSignedOut,
  isSignedIn: true,
};

test("AuthGate redirects to /auth when not signed in", () => {
  const { container } = render(
    <GoogleAuthProviderFallback>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<AuthGate />}>
            <Route index element={<div>Protected content</div>} />
          </Route>
          <Route path="/auth" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthProviderFallback>,
  );
  expect(within(container).getByText("Login page")).toBeInTheDocument();
  expect(within(container).queryByText("Protected content")).not.toBeInTheDocument();
});

test("AuthGate renders Outlet (child content) when signed in", () => {
  const { container } = render(
    <GoogleAuthContext.Provider value={mockAuthValueSignedIn}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<AuthGate />}>
            <Route index element={<div>Protected content</div>} />
          </Route>
          <Route path="/auth" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );
  expect(within(container).getByText("Protected content")).toBeInTheDocument();
  expect(within(container).queryByText("Login page")).not.toBeInTheDocument();
});

test("AuthLoginRoute redirects to / when signed in", () => {
  const { container } = render(
    <GoogleAuthContext.Provider value={mockAuthValueSignedIn}>
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<AuthLoginRoute />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );
  expect(within(container).getByText("Dashboard")).toBeInTheDocument();
});

test("AuthLoginRoute renders LoginPage when not signed in", () => {
  const { container } = render(
    <GoogleAuthProviderFallback>
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<AuthLoginRoute />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthProviderFallback>,
  );
  expect(within(container).getByText("Create your Ortho account")).toBeInTheDocument();
  expect(within(container).queryByText("Dashboard")).not.toBeInTheDocument();
});
