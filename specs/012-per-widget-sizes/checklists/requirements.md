# Requirements Checklist: Per-Widget Size Presets (S/M/L)

**Purpose**: Verify all functional requirements and acceptance criteria from the spec are met
**Created**: 2026-02-21
**Feature**: [spec.md](../spec.md)

## Type System & Registry

- [ ] CHK001 `WidgetSize` type is `"sm" | "md" | "lg"` only — no `wide`, `tall`, `wide-lg`, `xl` (FR-001)
- [ ] CHK002 Every widget in the registry defines `sizeDims: Record<WidgetSize, { w: number; h: number }>` (FR-002)
- [ ] CHK003 `allowedSizes` property is removed from all widget registry entries (FR-005)
- [ ] CHK004 No TypeScript compilation errors after type change (SC-003)

## Dimension Lookup

- [ ] CHK005 Global `SIZE_TO_DIMS` mapping is removed from the layout context (FR-003)
- [ ] CHK006 Dimension resolution uses per-widget `sizeDims` from the registry (FR-003)
- [ ] CHK007 KPI widgets (net-cash-flow, total-spent, total-income, total-debt, smart-insights) use S=2×2, M=4×2, L=4×3
- [ ] CHK008 Chart widgets (cash-flow-chart, category-chart, owner-split-chart) use S=4×3, M=8×6, L=8×12
- [ ] CHK009 Table/list widgets (debt-snapshot, spend-by-source, owner-transfers, recent-activity) use S=4×3, M=4×6, L=8×6
- [ ] CHK010 quick-add uses S=4×3, M=8×4, L=8×6
- [ ] CHK011 net-trend-chart uses S=4×3, M=8×4, L=8×6

## Size Picker UI

- [ ] CHK012 Desktop popover shows exactly 3 size options: "S", "M", "L" (FR-004, SC-001)
- [ ] CHK013 Mobile long-press popover shows exactly 3 size options: "S", "M", "L" (FR-004)
- [ ] CHK014 `SIZE_LABELS` mapping is `{ sm: "S", md: "M", lg: "L" }` (FR-006)
- [ ] CHK015 Selecting a size resizes the widget to the correct per-widget dimensions (US1-AS2, US1-AS3)
- [ ] CHK016 Selecting the already-active size closes the popover without changes (US1-AS4)

## Widget Card Styling

- [ ] CHK017 `SIZE_PADDING` in DsWidgetCard has exactly 3 entries for `sm`, `md`, `lg` (FR-007)
- [ ] CHK018 `SIZE_DENSITY` in DsWidgetCard has exactly 3 entries for `sm`, `md`, `lg` (FR-007)

## localStorage Migration

- [ ] CHK019 Default layout version is bumped from 4 to 5 (FR-008)
- [ ] CHK020 Migration function maps: `sm`→`sm`, `wide`→`md`, `md`→`md`, `tall`→`md`, `wide-lg`→`lg`, `lg`→`lg`, `xl`→`lg` (FR-009)
- [ ] CHK021 Migration preserves widget positions (x, y coordinates) (FR-010)
- [ ] CHK022 Layout version is updated to 5 after migration (US3-AS3)
- [ ] CHK023 Layouts already at version 5+ are not re-migrated (US3-AS4)
- [ ] CHK024 New users get version-5 default layout directly, no migration (SC-005)

## Widget Component Updates

- [ ] CHK025 Widget components that branch on size handle only `sm`, `md`, `lg` values (FR-011)
- [ ] CHK026 No references to old size names (`wide`, `tall`, `wide-lg`, `xl`) remain in source code (SC-006)

## i18n

- [ ] CHK027 i18n keys related to old size names are updated or removed (FR-012)

## Integration

- [ ] CHK028 Selecting "L" on a KPI widget produces different dimensions than "L" on a chart widget (SC-002)
- [ ] CHK029 Existing version-4 localStorage layouts render correctly after migration (SC-004)
- [ ] CHK030 Grid reflows correctly when migrated sizes produce different dimensions than before

## Notes

- Check items off as completed: `[x]`
- Items reference spec requirements (FR-xxx) and success criteria (SC-xxx)
- US1-AS2 means User Story 1, Acceptance Scenario 2
