# Budget Tool

A budgeting app for tracking expenses and income, splitting spending (50/50, Nova’s Purchases, your spending), and syncing to Google Sheets. Built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

**Features**

- **Import CSV**: American Express (Chase and Apple stubs ready for sample CSVs)
- **Category rules**: Pattern-based auto-categorization (e.g. “Uber Eats” → 50/50); edit per transaction
- **Income**: Manual entry (paycheck, rent, bonus)
- **Totals**: Total Earned, Total Spent, Total Spent w/o Mortgage, 50/50 Split, Nova’s/your spending, savings rate
- **Google Sheets**: Sign in with Google, set spreadsheet ID/URL, sync Expenses, Income, and Totals sheets

**Google Sheets setup**

1. Create a [Google Cloud project](https://console.cloud.google.com/), enable the **Google Sheets API**, and create an **OAuth 2.0 Client ID** (Web application).
2. Add your app origin (e.g. `http://localhost:5173`) to Authorized JavaScript origins.
3. In the project root, create `.env` with:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
4. In the app, go to **Settings** → Connect Google → paste your spreadsheet URL or ID → **Sync to Google Sheets**.

## Setup

```bash
bun install
```

## Development

```bash
bun dev
```

## Build

```bash
bun run build
```

## Preview production build

```bash
bun run preview
```

## Testing

Tests use **Bun’s built-in test runner** with **React Testing Library** and **@testing-library/jest-dom** matchers. DOM tests run in **happy-dom** (via `@happy-dom/global-registrator`).

```bash
bun test          # run tests (watch mode)
bun run test:run  # run tests once
```

Tests live in the **`test/`** directory, mirroring `src/`: `test/lib/` for lib unit tests, `test/components/` for component tests, and `test/pages/` for page tests. Setup runs from `test/setup.ts` (happy-dom + jest-dom matchers).

## Translations

The app supports **English (en)**, **Spanish (es)**, **Bangla (bn)**, **Chinese (zh)**, **Korean (ko)**, **Hindi (hi)**, and **Japanese (ja)**. Use the globe dropdown in the sidebar to switch language. The selected language is stored in `localStorage` under the key `ortho-locale` and is used on the next load.

- **Strings**: Translation keys live in `src/locales/en.json` and `src/locales/es.json`, grouped by feature (e.g. `nav`, `layout`, `dashboard`, `transactions`).
- **Adding a locale**: Add a new JSON file under `src/locales/` (e.g. `fr.json`) with the same key structure, register it in `src/i18n.ts` in the `resources` object and in the initial-language check, then add an option to the language Select in `Layout.tsx`.

## Architecture

- **`src/lib/`**: Pure helpers where possible (formatting, totals, category rules, parsers, date repair, import dedup). I/O (Google Sheets, PDF export) is isolated in dedicated modules.
- **Components**: Kept small; shared UI in `src/components/ui/` (shadcn), page-specific sections in `src/pages/dashboard/` etc.
- **Refactors**: Done incrementally with tests added or updated first; run `bun test` after each change.

## Adding shadcn components

```bash
npx shadcn@latest add <component-name>
```
