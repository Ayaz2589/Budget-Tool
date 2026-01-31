# Architecture

## App entry

- **main.tsx** — Renders `<App />` into `#root`; wraps app in `StrictMode` and `I18nextProvider`.
- **App.tsx** — Wraps content in `BudgetProvider`, `PresetTransactionsProvider`, `RulesProvider`. If `VITE_GOOGLE_CLIENT_ID` is set, wraps in `GoogleOAuthProvider` and `GoogleAuthProvider`; otherwise uses `GoogleAuthProviderFallback`. Renders `AppContent` (router).

## Routing

- **BrowserRouter** — Wraps all routes.
- **Routes:**
  - **`/`** — Renders `LandingRoute`. When signed in, redirects to `/dashboard`. When not signed in and returning user (localStorage flag `budget-tool-returning-user` set), redirects to `/auth`. Else (new visitor) renders `LandingPage` (marketing hero, features, CTA to `/auth`).
  - **`/auth`** — Renders `AuthLoginRoute`. When signed in, redirects to `/dashboard`. When not signed in, renders `LoginPage` (full-page two-column login). Visiting `/auth` sets the returning-user flag.
  - **AuthGate (no path)** — Layout route for `/dashboard`. When not signed in, redirects to `/auth`. When signed in, renders `<Outlet />` (child routes).
  - **`/dashboard`** — Renders `Layout`; nested routes:
    - **index** — Dashboard
    - **import** — ImportPage
    - **transactions** — TransactionsPage
    - **income** — IncomePage
    - **debt** — DebtPage
    - **mortgage** — MortgagePage
    - **rules** — RulesPage
    - **settings** — SettingsPage

All app pages (dashboard, transactions, income, etc.) are behind AuthGate at `/dashboard`; unauthenticated users are redirected to `/auth`. New visitors see the landing at `/`; returning visitors (flag set on sign-out or visit to `/auth`) go straight to `/auth` when they hit `/`.

## Context hierarchy

1. **BudgetProvider** — `src/context/BudgetContext.tsx`. Holds expenses, income, debts, debtPayments, expenseCategories, incomeCategories, cardSources, iOweNova. Persists to localStorage (`budget-tool-data`). Exposes add/update/remove and setExpenseCategories, setIncomeCategories, setCardSources.
2. **PresetTransactionsProvider** — `src/context/PresetTransactionsContext.tsx`. Holds preset transactions. Persists to localStorage (`budget-tool-preset-transactions`).
3. **RulesProvider** — `src/context/RulesContext.tsx`. Holds rules. Persists to localStorage (`budget-tool-rules`).
4. **GoogleOAuthProvider** (optional) — From `@react-oauth/google`. Provides Google GSI client.
5. **GoogleAuthProvider** or **GoogleAuthProviderFallback** — `src/context/GoogleAuthContext.tsx`. Holds accessToken, expiresAt, userProfile, spreadsheetId; signIn, signOut; syncToSheets, pullFromSheet. Token persisted in localStorage (`budget-tool-google-access-token`); spreadsheet ID in `budget-tool-spreadsheet-id`.

## Auth flow

- **Sign-in:** User clicks "Sign in with Google" (LoginPage or sidebar). `useGoogleLogin` (implicit flow) opens Google consent; on success, token and `expires_in` are stored; `setAccessToken` and `setExpiresAt` are called.
- **Token persistence:** Token and `expires_at` are written to localStorage. On load, `getStoredAccessToken()` and `getStoredExpiresAt()` restore state; if token is expired, null is returned.
- **Token expiry (in-session):** A 60s interval in GoogleAuthContext checks `expiresAt`; if `Date.now() >= expiresAt`, `clearSession()` is called (clear token, setAccessToken(null), setExpiresAt(null), setUserProfile(null)).
- **401 from Sheets API:** In `syncToSheets` and `pullFromSheet` catch blocks, if the error message contains `401`, `clearSession()` is called.
- **Redirect when sign-in lost:** In Layout, an effect watches `isSignedIn`; when it transitions from true to false, `navigate("/auth")` is called.
- **Returning-user flag:** On sign-out, `clearSession()` in GoogleAuthContext sets `localStorage.setItem('budget-tool-returning-user', '1')`. On visit to LoginPage (`/auth`), the same key is set. LandingRoute at `/` shows the landing only when not signed in and the flag is not set; otherwise redirects to `/auth` (returning) or `/dashboard` (signed in).

## Layout

- **Layout.tsx** — Renders sidebar (desktop) or header + bottom nav (mobile). Sidebar contains nav links, language switcher, and sign-in/sign-out + user profile. Main content area renders `<Outlet />` (the current nested route). Mobile "More" opens a dialog with additional nav links.
