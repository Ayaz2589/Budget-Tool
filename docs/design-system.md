# Design System (Tailwind v4)

## Purpose
This app uses a Tailwind-first design system with semantic tokens, standardized UI primitives, and reusable app-level patterns.

The goal is consistent visual behavior across dashboard, transactions, income, debt, mortgage, presets, and shared dialogs/sheets.

## Token Contract
Defined in `src/index.css`.

### Core surfaces and text
- `--surface-0`
- `--surface-1`
- `--surface-2`
- `--text-primary`
- `--text-secondary`
- `--text-tertiary`

### Interactive
- `--interactive-primary`
- `--interactive-primary-foreground`
- `--interactive-danger`
- `--focus-ring`

### Borders
- `--border-subtle`
- `--border-strong`

### Visualization
- `--viz-income`
- `--viz-expense`
- `--viz-debt`
- `--viz-series-1` to `--viz-series-5`

### Typography and spacing
- typography scale variables (`--font-size-display`, heading/body/label/caption)
- spacing rhythm variables (`--space-compact-*`, `--space-regular-*`)
- shadow variables (`--shadow-soft`, `--shadow-strong`)

## Primitive Contracts (`src/components/ui`)

### Button
`<Button />` supports:
- `variant`: `default | destructive | outline | secondary | ghost | link`
- `intent`: `neutral | primary | danger | success`
- `density`: `compact | default | comfortable`
- `surface`: `solid | flat | raised`

### Input
`<Input />` supports:
- `density`: `compact | default | comfortable`
- `intent`: `neutral | primary | danger | success`
- `surface`: `flat | raised | glass`

### SelectTrigger
`<SelectTrigger />` supports:
- `density`: `compact | default | comfortable`
- `intent`: `neutral | primary | danger | success`
- `surface`: `flat | raised | glass`
- `size` remains supported for backward compatibility.

### Card
`<Card />` supports:
- `surface`: `flat | raised | glass`
- `density`: `compact | default | comfortable`

### Table
`<Table />` supports:
- `density`: `compact | default | comfortable`

### ChartContainer
`<ChartContainer />` supports:
- `heightMobile` (number, px)
- `heightDesktop` (number, px)
- `legendMode`: `inline | below`

## DS Pattern Layer (`src/components/ds`)
- `DsSectionHeader`
- `DsMetricCard`
- `DsDataRow`
- `DsSplitToggle`
- `DsSheetHeader`
- `DsSheetActions`
- `DsChartCard`
- `DsLegendList`
- `DsEmptyState`
- `DsActionBar`

Use these patterns for app screens instead of ad hoc one-off layouts.

## Migration Rules
- Prefer DS pattern components before introducing page-specific wrappers.
- Keep mobile touch targets at least 44px high.
- Keep sheet titles left-aligned and action rows consistent.
- Keep chart heights explicit via `heightMobile`/`heightDesktop`.
- Reuse DS empty states and row patterns for all table/list surfaces.

## Guardrails
- No page-specific segmented-toggle redesigns; use `DsSplitToggle`.
- No custom floating mobile action bars; use `DsActionBar`.
- No custom sheet header/footer layout; use `DsSheetHeader` and `DsSheetActions`.
- Keep new component APIs additive before removing old props.
