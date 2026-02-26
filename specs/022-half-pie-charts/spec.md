# Feature Specification: Half-Pie Charts with Gaps & Rounded Corners

**Feature Branch**: `022-half-pie-charts`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Update all pie charts in dashboard to be Pie Chart with gap and rounded corners from recharts. They should only be a half pie as it takes up less white space in cards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Half-Pie Chart Display (Priority: P1)

A user opens the dashboard and sees the Category Chart and Owner Split Chart rendered as half-pie (semicircle) charts instead of full-circle pie charts. The half-pie shape occupies less vertical space within widget cards, reducing wasted whitespace and creating a more compact, polished layout.

**Why this priority**: This is the core visual change — converting full pies to half pies. Without this, the feature has no value.

**Independent Test**: Can be verified by opening the dashboard with expense data and confirming both pie charts render as semicircles (180-degree arc) at all supported widget sizes (md and lg).

**Acceptance Scenarios**:

1. **Given** a user has expense data, **When** they view the Category Chart widget at lg size, **Then** the chart renders as a half-pie (semicircle) instead of a full circle
2. **Given** a user has expense data, **When** they view the Category Chart widget at md size, **Then** the chart renders as a half-pie (semicircle) instead of a full circle
3. **Given** a user has owner data, **When** they view the Owner Split Chart widget at any size, **Then** the chart renders as a half-pie (semicircle) instead of a full circle
4. **Given** a user resizes the browser window, **When** the chart container adjusts, **Then** the half-pie scales proportionally and remains visually centered

---

### User Story 2 - Rounded Corners & Gaps on Segments (Priority: P1)

Each segment of the pie chart has rounded corners (rounded end caps) and visible gaps between adjacent segments, giving the chart a modern, clean appearance.

**Why this priority**: Rounded corners and gaps are core parts of the requested visual update and must ship alongside the half-pie shape.

**Independent Test**: Can be verified by viewing any pie chart with two or more segments and confirming each segment has visibly rounded end caps and gaps between slices.

**Acceptance Scenarios**:

1. **Given** a pie chart has multiple segments, **When** it renders, **Then** each segment displays rounded corners at both ends
2. **Given** a pie chart has multiple segments, **When** it renders, **Then** each segment is visually separated by a consistent gap
3. **Given** a pie chart has only one segment (100%), **When** it renders, **Then** the single segment displays rounded corners with no gap artifacts
4. **Given** a pie chart has exactly two segments, **When** it renders, **Then** a gap is visible between the two segments

---

### Edge Cases

- What happens when there is only one category/owner (single segment)? The half-pie should render as a single rounded semicircle with no gap artifacts.
- What happens when a segment is very small (e.g., < 2% of total)? The segment should still be visible and maintain rounded corners without overlapping adjacent segments.
- What happens when the widget is at sm size? The sm size renders text-only summaries (no chart), so no visual change is needed.
- What happens in dark mode? The same half-pie style, gaps, and rounded corners should render correctly with the existing dark mode color palette.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All dashboard pie charts (Category Chart, Owner Split Chart) MUST render as half-pie (semicircle, 180-degree arc) instead of full-circle pies
- **FR-002**: All pie chart segments MUST display rounded corners (rounded end caps) on both ends of each segment
- **FR-003**: All pie chart segments MUST have a visible gap (padding space) between adjacent segments
- **FR-004**: The half-pie chart MUST scale responsively within the ChartContainer at both md and lg widget sizes
- **FR-005**: The half-pie chart MUST maintain the existing color palette (viz CSS variables)
- **FR-006**: The half-pie chart MUST preserve existing tooltip behavior on hover
- **FR-007**: The half-pie chart MUST preserve existing legend behavior displaying category/owner labels and values
- **FR-008**: The sm widget size MUST remain unchanged (text-only summary, no chart)
- **FR-009**: The half-pie chart MUST render correctly in both light and dark modes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both Category Chart and Owner Split Chart render as 180-degree semicircle arcs at md and lg widget sizes
- **SC-002**: Visible rounded corners are present on every pie segment across all pie charts
- **SC-003**: Visible gaps exist between all adjacent segments in every pie chart
- **SC-004**: No visual regressions in tooltips, legends, colors, or responsive behavior compared to the current full-circle pie charts
- **SC-005**: Charts render correctly on both light and dark themes without color or layout issues

## Assumptions

- The recharts library (already in use) supports the half-pie configuration via startAngle and endAngle props, rounded corners via cornerRadius, and segment gaps via paddingAngle.
- Container height for pie chart widgets may need adjustment since a half-pie occupies roughly half the vertical space of a full pie.
- The existing outerRadius values (80 for lg, 60 for md) may need tuning to fill the available space appropriately.
- No changes are needed to the data model, selectors, or widget registry — this is a purely visual/presentational change.
