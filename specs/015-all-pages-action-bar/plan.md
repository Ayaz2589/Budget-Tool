# Implementation Plan: All Pages Action Bar

**Branch**: `015-all-pages-action-bar` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)

## Summary

Extend the unified floating action bar pattern (from feature 014) to all remaining pages. Each page passes `mobileOnly={false}` to DsActionBar and removes its desktop header action buttons.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: React, Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: N/A
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + mobile)
**Project Type**: Web (single SPA)
**Constraints**: Must not break existing mobile behavior; DsActionBar `mobileOnly` prop already available from feature 014

## Files to Modify

| Page | File | Desktop Buttons to Remove | Action Bar Buttons |
|------|------|---------------------------|-------------------|
| Income | src/pages/income/IncomePage.tsx | 1: Add Income | 1: Plus |
| Debt | src/pages/debt/DebtPage.tsx | 1: Add Debt | 1: Plus |
| Mortgage | src/pages/mortgage/MortgagePage.tsx | 1: Add Payment | 1: Plus |
| Presets | src/pages/presets/PresetsPage.tsx | 1: Add Preset | 1: Plus |
| Transactions | src/pages/transactions/TransactionsPage.tsx | TransactionsToolbar (2 buttons) | 2: Filters, Plus |
| Import | src/pages/import/ImportPage.tsx | 1: conditional import button | 1: conditional import button |
