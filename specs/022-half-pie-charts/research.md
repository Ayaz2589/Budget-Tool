# Research: Half-Pie Charts with Gaps & Rounded Corners

**Branch**: `022-half-pie-charts` | **Date**: 2026-02-23

## R1: Recharts Half-Pie (Semicircle) Configuration

**Decision**: Use `startAngle={180}` and `endAngle={0}` on the `<Pie>` component.

**Rationale**: Recharts uses a standard polar coordinate system (0° = 3 o'clock, 90° = 12 o'clock, 180° = 9 o'clock). Setting `startAngle={180}` and `endAngle={0}` produces a top-facing semicircle with a flat bottom edge, sweeping from left through top to right.

**Alternatives considered**:
- `startAngle={0}, endAngle={180}` — produces a bottom-facing semicircle (flat top), less natural
- `startAngle={270}, endAngle={90}` — produces a left-facing semicircle, not suitable for cards

**Gotcha**: The `PieChart` container allocates space for a full circle regardless of angle range. Must use `cy="70%"` or `cy="80%"` on the `<Pie>` to push the center down, and reduce container height to approximately half the width to eliminate dead whitespace below the arc.

## R2: Rounded Corners via cornerRadius

**Decision**: Use `cornerRadius={6}` on the `<Pie>` component.

**Rationale**: For segments with `outerRadius` values of 60-80px, a `cornerRadius` of 6px produces visibly rounded end caps without overwhelming small segments. This is the recharts built-in prop — no custom shape renderer needed.

**Alternatives considered**:
- `cornerRadius={3-4}` — too subtle, barely visible
- `cornerRadius={8-10}` — too aggressive for smaller segments, can cause visual overlap
- Custom `activeShape` renderer — unnecessary complexity for this use case

**Gotcha**: `cornerRadius` rounds all four corners of each sector (both inner and outer edges if `innerRadius` is set). For a solid pie (no `innerRadius`), only outer edge corners are rounded. Small segments (< 2% of total) may not render corner radius correctly — mitigated by using `minAngle={5}` to ensure minimum angular width.

## R3: Segment Gaps via paddingAngle

**Decision**: Use `paddingAngle={4}` on the `<Pie>` component.

**Rationale**: For a 180-degree arc with typically 3-7 segments, `paddingAngle={4}` creates clearly visible but not excessive gaps. With 5 segments this consumes ~16° out of 180° (~9%) — noticeable but balanced.

**Alternatives considered**:
- `paddingAngle={2}` — too subtle, gaps barely visible
- `paddingAngle={6-8}` — too prominent for semicircle where angular budget is already halved
- Custom stroke-based gaps — less consistent, harder to maintain

**Gotcha**: Zero-value data entries can cause sector overlap with `paddingAngle`. Must filter out zero-value entries before passing data to `<Pie>`.

## R4: Container Height Adjustment

**Decision**: Reduce `ChartContainer` heights since half-pie needs roughly half the vertical space.

**Rationale**: Current heights are `heightMobile={140-200}` and `heightDesktop={140-220}`. A half-pie with `cy="80%"` places most of the visual content in the upper portion. Container heights can be reduced to approximately 120-140px for lg and 100-120px for md to eliminate dead whitespace below the arc.

**Alternatives considered**:
- Keep current heights and use negative margins — fragile, breaks responsive behavior
- Use `aspect` prop on ResponsiveContainer — less predictable across widget sizes

## R5: Existing Component Analysis

**Decision**: Modify the `<Pie>` props in-place within `CategoryChart.tsx` and `OwnerSplitChart.tsx`. No new components needed.

**Rationale**: Both files have nearly identical pie chart configurations. The change is limited to adding 4 props (`startAngle`, `endAngle`, `cornerRadius`, `paddingAngle`) and adjusting `cy` on each `<Pie>`, plus reducing `ChartContainer` heights.

**Files to modify**:
- `src/pages/dashboard/widgets/CategoryChart.tsx` — 2 `<Pie>` instances (lg and md sizes)
- `src/pages/dashboard/widgets/OwnerSplitChart.tsx` — 1 `<Pie>` instance (shared across md/lg)

**Files unchanged**:
- `src/components/ui/chart.tsx` — ChartContainer needs no structural changes
- `src/lib/widgets/widgetRegistry.tsx` — widget dimensions may need minor height reduction
- `src/components/ds/DsLegendList.tsx` — legend unaffected

## R6: recharts Version Compatibility

**Decision**: Current recharts v2.15.4 fully supports all required props.

**Rationale**: `startAngle`, `endAngle`, `cornerRadius`, and `paddingAngle` have been stable since recharts v2.x. No version upgrade needed. Tooltip positioning with inverted angles (startAngle > endAngle) was fixed in v2.12+.
