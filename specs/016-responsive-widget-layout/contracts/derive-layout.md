# Contract: deriveSmLayout

**Purpose**: Pure function to scale a 24-column RGL layout to a 12-column layout.

## Signature

```
deriveSmLayout(lgLayout: Layout[]) → Layout[]
```

## Input

- `lgLayout`: Array of RGL `Layout` items with `{ i, x, y, w, h }` in a 24-column coordinate system.

## Output

- Array of RGL `Layout` items with `x` and `w` scaled to fit a 12-column grid.
- `y` and `h` remain unchanged.
- `i` remains unchanged.

## Rules

1. `w' = max(1, round(w * 0.5))` — width halved, minimum 1
2. `x' = min(round(x * 0.5), 12 - w')` — position halved, clamped so widget fits
3. `y' = y` — vertical position unchanged
4. `h' = h` — height unchanged

## Examples

| Input (24-col) | Output (12-col) | Widget type |
|-----------------|-----------------|-------------|
| `{ x: 0, w: 6 }` | `{ x: 0, w: 3 }` | KPI card (md) |
| `{ x: 6, w: 6 }` | `{ x: 3, w: 3 }` | KPI card (md) |
| `{ x: 12, w: 6 }` | `{ x: 6, w: 3 }` | KPI card (md) |
| `{ x: 18, w: 6 }` | `{ x: 9, w: 3 }` | KPI card (md) |
| `{ x: 0, w: 12 }` | `{ x: 0, w: 6 }` | Chart (lg) |
| `{ x: 12, w: 12 }` | `{ x: 6, w: 6 }` | Chart (lg) |
| `{ x: 0, w: 24 }` | `{ x: 0, w: 12 }` | Full-width |
| `{ x: 0, w: 3 }` | `{ x: 0, w: 2 }` | KPI (sm) |
| `{ x: 0, w: 1 }` | `{ x: 0, w: 1 }` | Minimum |

## Invariants

- For all items: `w' >= 1`
- For all items: `x' + w' <= 12`
- For all items: `x' >= 0`
- Output length equals input length
- Item order preserved
