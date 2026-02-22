# Research: Responsive Widget Layout

**Feature**: 016-responsive-widget-layout
**Date**: 2026-02-22

## R1: react-grid-layout `Responsive` onLayoutChange Signature

**Decision**: Use the two-argument `onLayoutChange(currentLayout, allLayouts)` signature provided by the `Responsive` component to detect which breakpoint triggered the callback.

**Rationale**: The `Responsive` component (used via `WidthProvider(Responsive)`) fires `onLayoutChange` with both the current breakpoint's layout array and a map of all breakpoint layouts. By inspecting the `allLayouts` object, we can determine if the `lg` key was the source of the change and only persist that. This avoids needing to track the current breakpoint separately via `onBreakpointChange`.

**Alternatives considered**:
- Track current breakpoint via `onBreakpointChange` callback + useRef: Works but adds state tracking complexity. Rejected for simplicity.
- Compare incoming layout against known `lg` layout to detect drift: Fragile and computationally unnecessary given the built-in two-argument callback.

## R2: Layout Scaling Strategy (24-col → 12-col)

**Decision**: Scale `x` and `w` by `0.5` (the ratio `12/24`), rounding to nearest integer, clamping `w >= 1` and `x + w <= 12`.

**Rationale**: Proportional scaling preserves the relative arrangement of widgets. A widget at `x=12, w=12` on 24-col becomes `x=6, w=6` on 12-col — it stays in the right half. Vertical compaction (`compactType="vertical"`) handles any gaps caused by widgets that can no longer fit side-by-side.

**Alternatives considered**:
- Full-width stacking (every widget gets `w=12`): Loses the multi-column layout entirely at the sm breakpoint. Too aggressive.
- Per-widget minimum widths from registry: Adds complexity. The proportional approach already produces usable widths (e.g., KPI `w=6` → `w=3`, still fits 4 across).
- Store separate sm layout in localStorage: Doubles storage and introduces sync complexity between lg and sm layouts. Rejected per FR-004/FR-006.

## R3: md Breakpoint Handling (996px-1200px)

**Decision**: Pass the `lg` layout as-is for the `md` breakpoint since both use 24 columns.

**Rationale**: The `md` breakpoint (996px-1200px) has the same 24-column count as `lg`. The only difference is narrower column width. Widget positions are identical; they just appear smaller. No transformation needed.

**Alternatives considered**:
- Apply a slight width reduction for very wide widgets at md: Unnecessary complexity. Widgets adapt via CSS/content wrapping.

## R4: Preventing Persistence of Derived Layout Changes

**Decision**: Use the `allLayouts` second argument to `onLayoutChange` to check if the `lg` key's layout has changed. Only persist if `lg` layout items differ from the current state. Additionally, only set `hasInteracted` on `onDragStart` which only fires at the `lg` breakpoint where dragging matters.

**Rationale**: The existing `hasInteracted` ref already prevents mount-time persistence. The additional check on the `allLayouts.lg` key ensures that reflows at `md`/`sm` don't propagate back to storage. This is a belt-and-suspenders approach that covers both drag and programmatic reflow scenarios.

**Alternatives considered**:
- Disable dragging at non-lg breakpoints: Simpler but potentially jarring if users try to drag on tablets. The current approach is transparent.
- Use `onBreakpointChange` to set a flag: Works but couples two callbacks unnecessarily.

## R5: Existing Test Coverage

**Decision**: Add a pure unit test for the `deriveSmLayout` helper function. No integration test changes needed since the existing Dashboard tests don't assert on RGL positions.

**Rationale**: The `deriveSmLayout` function is pure (input → output) and easily testable in isolation. The existing Dashboard render tests verify that widgets are visible and functional, which remains unchanged. Integration testing of RGL breakpoint behavior requires a real browser and is better covered by manual verification.

**Alternatives considered**:
- Full integration test with mocked viewport widths: react-grid-layout's WidthProvider depends on DOM measurements not available in happy-dom. Not feasible without a real browser.
