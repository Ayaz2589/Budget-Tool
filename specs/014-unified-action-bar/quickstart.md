# Quickstart: Unified Action Bar

## Test Scenarios

### S1: Desktop floating action bar appears
1. Open the dashboard on a desktop viewport (≥768px)
2. Verify a floating pill-shaped action bar appears at the bottom-right
3. Verify it contains 3 icon-only buttons: Settings, Add Income, Add Expense
4. Click each button and verify it opens the correct dialog/sheet

### S2: Desktop header no longer has transaction action buttons
1. Open the dashboard on desktop
2. Verify the header does NOT contain "Add Expense", "Add Income", or "Settings" text+icon buttons
3. Verify the header still shows the title, subtitle, currency chip, and "Manage Widgets" icon button

### S3: Mobile action bar unchanged
1. Open the dashboard on a mobile viewport (<768px)
2. Verify the floating action bar still appears above the bottom nav
3. Verify it contains the same 3 buttons as before
4. Verify positioning is unchanged (above MobileBottomNav)

### S4: Widget catalog accessible from header
1. On desktop, click the "Manage Widgets" icon button in the header
2. Verify the widget catalog sheet opens
3. Verify you can show/hide widgets

### S5: Reset Layout accessible from widget catalog
1. Open the widget catalog sheet
2. Verify a "Reset Layout" button appears in the sheet footer
3. Click it and verify a confirmation dialog appears
4. Confirm and verify the layout resets to default

### S6: Empty dashboard shows action bar
1. Clear all data (expenses, income, debts)
2. Open the dashboard
3. Verify the empty state message appears
4. Verify the floating action bar still appears with all 3 buttons

### S7: Action bar doesn't obscure content
1. On desktop, scroll the dashboard to the bottom
2. Verify the action bar floats above the content
3. Verify no widget content is obscured by the action bar
