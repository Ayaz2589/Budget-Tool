# Ortho Budget Tool — Documentation

Documentation for the Ortho budget app. Written for both humans and AI agents.

## Doc index

| File | Purpose |
|------|--------|
| [architecture.md](architecture.md) | App entry, routing, auth gate, context hierarchy, auth flow. |
| [data-model.md](data-model.md) | Core types, localStorage keys, minified payload (V2 blob). |
| [features.md](features.md) | Feature list with entry points and backing lib modules. |
| [modules.md](modules.md) | File tree of `src/` with one-line description per file/module. |
| [google-sheets.md](google-sheets.md) | Sheets API usage, sync vs restore, Data blob, sheet layout. |
| [testing.md](testing.md) | How to run tests, setup, structure, conventions. |
| [equations.md](equations.md) | Equation inventory for finance, conversion, date, and operational math. |

## For AI agents

- Start with **architecture.md** (routing, auth, context) and **modules.md** (where code lives).
- Use **data-model.md** for types, storage keys, and payload format (e.g. V2 blob keys).
- Use **features.md** to map features to pages and lib modules.
- Use **google-sheets.md** for sync/restore and blob format.

## Glossary

- **ExpenseSource** — Type for card/expense source: `amex`, `amex-gold`, `chase`, `apple`, `manual`, `td`. Defined in `src/lib/types.ts`.
- **Card sources** — User-configurable list of enabled sources (Settings → Card sources). Only enabled sources appear in transaction dropdowns, filters, rules, and import.
- **V2 blob** — Machine-readable export format: gzip-compressed JSON, Base64-encoded, prefixed with `V2`. Used in PDF export/import and Google Sheets Data tab. Keys: `e` (expenses), `i` (income), `d` (debts), `dp` (debt payments), `r` (rules), `pt` (presets), `ec`/`ic` (category colors), `sc` (card sources).
