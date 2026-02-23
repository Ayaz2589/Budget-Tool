# Quickstart: Widget Creator Function

**Feature**: 018-widget-creator | **Date**: 2026-02-22

## Setup

No new dependencies. This feature only adds/modifies files within the existing project.

```bash
# Ensure you're on the feature branch
git checkout 018-widget-creator

# Install deps (if needed)
bun install
```

## Development

```bash
bun dev          # Dev server
bun test         # Run all tests (watch mode)
bun run build    # TypeScript check + Vite build
bun run lint     # ESLint
```

## Usage

### Creating a widget with the factory

```typescript
import { createWidget } from "@/lib/createWidget";

// Minimal (defaultSize defaults to "md")
createWidget({
  type: "my-widget",
  label: "widget.myWidget",
  icon: <MyIcon className="size-4" />,
  sizeDims: KPI_DIMS,
  render: (props, size) => <MyWidget data={props.myData} size={size} />,
})

// With custom defaultSize and className
createWidget({
  type: "my-widget",
  label: "widget.myWidget",
  icon: <MyIcon className="size-4" />,
  sizeDims: CHART_WIDE_DIMS,
  defaultSize: "lg",
  className: "bg-accent/10",
  render: (props, size) => <MyWidget data={props.myData} size={size} />,
})
```

## Verification

```bash
# Run factory tests
bun test test/lib/createWidget.test.tsx

# Run all tests (ensure no regressions from migration)
bun test

# Build check
bun run build
```

## Files

| File | Action |
|------|--------|
| `src/lib/createWidget.tsx` | NEW — factory function |
| `src/lib/widgetRegistry.tsx` | MODIFY — migrate 14 entries |
| `test/lib/createWidget.test.tsx` | NEW — unit tests |
