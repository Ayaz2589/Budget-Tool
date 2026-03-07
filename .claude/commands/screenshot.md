---
name: screenshot
description: Load the most recent screenshot(s) from the Desktop for visual reference. Pass a number to load multiple (e.g., /screenshot 3).
---

## Input

The number of screenshots to load is: `$ARGUMENTS`

If no number was provided, default to **1** (the most recent screenshot).

## Instructions

### 1. Find screenshots on Desktop

List all screenshot files on the Desktop sorted by modification time (newest first):

```bash
ls -t ~/Desktop/Screenshot*.png 2>/dev/null
```

If no screenshots are found, also try:
```bash
ls -t ~/Desktop/Screen\ Shot*.png 2>/dev/null
```

If still none found, tell the user: "No screenshots found on the Desktop."

### 2. Select the requested number

Take the first N files from the sorted list, where N is the number from `$ARGUMENTS` (default 1).

If the user requested more screenshots than exist, use all available and mention how many were found.

### 3. Read each screenshot

Use the **Read** tool to read each screenshot file path. The Read tool supports image files and will present them visually.

Read them in chronological order (oldest first) so the most recent is shown last.

### 4. Present context

After reading, summarize what was loaded:

```
Loaded N screenshot(s):
1. Screenshot 2026-03-04 at 11.08.41 AM.png (most recent)
2. Screenshot 2026-03-04 at 10.50.15 AM.png
...
```

Then ask: **"What would you like me to do with this?"**
