import { useState } from "react";
import { beforeEach, describe, expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  DashboardLayoutProvider,
  useDashboardLayout,
} from "@/context/DashboardLayoutContext";
import { DEFAULT_LAYOUT } from "@/lib/defaultLayout";
import { STORAGE_KEYS } from "@/lib/storage";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getText(testId: string) {
  return screen.getByTestId(testId).textContent ?? "";
}

function setInput(testId: string, value: string) {
  fireEvent.change(screen.getByTestId(testId), { target: { value } });
}

/* ------------------------------------------------------------------ */
/*  Probe component — exposes context through the DOM                  */
/* ------------------------------------------------------------------ */

function LayoutProbe() {
  const ctx = useDashboardLayout();
  const [saveResult, setSaveResult] = useState("");
  const [renameResult, setRenameResult] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [targetValue, setTargetValue] = useState("");

  return (
    <div>
      <p data-testid="active-id">{ctx.activeLayoutId}</p>
      <p data-testid="active-name">{ctx.activeLayoutName}</p>
      <p data-testid="layout-count">{ctx.savedLayouts.length}</p>
      <p data-testid="layout-names">
        {ctx.savedLayouts.map((l) => l.name).join(",")}
      </p>
      <p data-testid="layout-ids">
        {ctx.savedLayouts.map((l) => l.id).join(",")}
      </p>
      <p data-testid="save-result">{saveResult}</p>
      <p data-testid="rename-result">{renameResult}</p>
      <p data-testid="first-widget-x">{ctx.layout.desktopGrid[0]?.x}</p>

      <input
        data-testid="name-input"
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value)}
      />
      <input
        data-testid="target-input"
        value={targetValue}
        onChange={(e) => setTargetValue(e.target.value)}
      />

      <button
        onClick={() => {
          const r = ctx.saveLayout(nameValue);
          setSaveResult(JSON.stringify(r));
        }}
      >
        save
      </button>
      <button onClick={() => ctx.switchLayout(targetValue)}>switch</button>
      <button onClick={() => ctx.deleteLayout(targetValue)}>delete</button>
      <button
        onClick={() => {
          const r = ctx.renameLayout(targetValue, nameValue);
          setRenameResult(JSON.stringify(r));
        }}
      >
        rename
      </button>
      <button
        onClick={() => {
          const grid = ctx.layout.desktopGrid.map((item, i) =>
            i === 0 ? { ...item, x: 77 } : item,
          );
          ctx.updateDesktopGrid(grid);
        }}
      >
        edit-grid
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <DashboardLayoutProvider>
      <LayoutProbe />
    </DashboardLayoutProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("DashboardLayoutContext — saved layouts", () => {
  describe("initial load / migration", () => {
    test("fresh install creates collection with default entry", () => {
      renderProbe();
      expect(getText("active-id")).toBe("default");
      expect(getText("active-name")).toBe("Default");
      expect(getText("layout-count")).toBe("1");
    });

    test("migrates existing single layout as 'My Layout'", () => {
      const customLayout = structuredClone(DEFAULT_LAYOUT);
      customLayout.desktopGrid[0].x = 42;
      localStorage.setItem(
        STORAGE_KEYS.DASHBOARD_LAYOUT,
        JSON.stringify(customLayout),
      );

      renderProbe();
      expect(getText("layout-count")).toBe("2");
      expect(getText("layout-names")).toContain("My Layout");
      expect(getText("layout-names")).toContain("Default");
      expect(getText("active-name")).toBe("My Layout");
    });

    test("corrupted saved-layouts key falls back to default", () => {
      localStorage.setItem(STORAGE_KEYS.SAVED_LAYOUTS, "INVALID JSON");
      renderProbe();
      expect(getText("active-id")).toBe("default");
      expect(getText("layout-count")).toBe("1");
    });

    test("loads valid saved collection from localStorage", () => {
      const collection = {
        activeId: "test-id",
        layouts: [
          {
            id: "default",
            name: "Default",
            layout: DEFAULT_LAYOUT,
            createdAt: 0,
          },
          {
            id: "test-id",
            name: "Test",
            layout: DEFAULT_LAYOUT,
            createdAt: 1000,
          },
        ],
      };
      localStorage.setItem(
        STORAGE_KEYS.SAVED_LAYOUTS,
        JSON.stringify(collection),
      );

      renderProbe();
      expect(getText("layout-count")).toBe("2");
      expect(getText("active-id")).toBe("test-id");
      expect(getText("active-name")).toBe("Test");
    });
  });

  describe("saveLayout", () => {
    test("saves layout with valid name", async () => {
      renderProbe();
      setInput("name-input", "Work Mode");
      fireEvent.click(screen.getByText("save"));

      await waitFor(() => {
        expect(getText("save-result")).toContain('"ok":true');
        expect(getText("layout-count")).toBe("2");
        expect(getText("layout-names")).toContain("Work Mode");
        expect(getText("active-name")).toBe("Work Mode");
      });
    });

    test("rejects empty name", async () => {
      renderProbe();
      setInput("name-input", "   ");
      fireEvent.click(screen.getByText("save"));

      await waitFor(() => {
        expect(getText("save-result")).toContain("empty_name");
        expect(getText("layout-count")).toBe("1");
      });
    });

    test("rejects name longer than 30 characters", async () => {
      renderProbe();
      setInput("name-input", "A".repeat(31));
      fireEvent.click(screen.getByText("save"));

      await waitFor(() => {
        expect(getText("save-result")).toContain("name_too_long");
      });
    });

    test("rejects when at 10-entry limit", async () => {
      const layouts = [
        {
          id: "default",
          name: "Default",
          layout: DEFAULT_LAYOUT,
          createdAt: 0,
        },
        ...Array.from({ length: 9 }, (_, i) => ({
          id: `layout-${i}`,
          name: `Layout ${i}`,
          layout: DEFAULT_LAYOUT,
          createdAt: i + 1,
        })),
      ];
      localStorage.setItem(
        STORAGE_KEYS.SAVED_LAYOUTS,
        JSON.stringify({ activeId: "default", layouts }),
      );

      renderProbe();
      expect(getText("layout-count")).toBe("10");

      setInput("name-input", "One Too Many");
      fireEvent.click(screen.getByText("save"));

      await waitFor(() => {
        expect(getText("save-result")).toContain("limit_reached");
        expect(getText("layout-count")).toBe("10");
      });
    });

    test("persists to localStorage after save", async () => {
      renderProbe();
      setInput("name-input", "Saved Layout");
      fireEvent.click(screen.getByText("save"));

      await waitFor(() => {
        expect(getText("save-result")).toContain('"ok":true');
      });

      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.SAVED_LAYOUTS)!,
      );
      expect(stored.layouts).toHaveLength(2);
      expect(stored.layouts[1].name).toBe("Saved Layout");
    });
  });

  describe("switchLayout", () => {
    test("switch changes active layout", async () => {
      renderProbe();
      setInput("name-input", "Custom");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("active-name")).toBe("Custom"));

      setInput("target-input", "default");
      fireEvent.click(screen.getByText("switch"));

      await waitFor(() => {
        expect(getText("active-id")).toBe("default");
        expect(getText("active-name")).toBe("Default");
      });
    });

    test("switch restores exact layout snapshot", async () => {
      renderProbe();

      // Edit the layout
      fireEvent.click(screen.getByText("edit-grid"));
      await waitFor(() => expect(getText("first-widget-x")).toBe("77"));

      // Save the edited layout
      setInput("name-input", "Edited");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("active-name")).toBe("Edited"));

      // Switch to default — should restore factory x=0
      setInput("target-input", "default");
      fireEvent.click(screen.getByText("switch"));
      await waitFor(() => expect(getText("first-widget-x")).toBe("0"));

      // Switch back to edited — should restore x=77
      const editedId = getText("layout-ids")
        .split(",")
        .find((id) => id !== "default")!;
      setInput("target-input", editedId);
      fireEvent.click(screen.getByText("switch"));
      await waitFor(() => expect(getText("first-widget-x")).toBe("77"));
    });
  });

  describe("deleteLayout", () => {
    test("removes non-active layout", async () => {
      renderProbe();

      setInput("name-input", "Temp");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("layout-count")).toBe("2"));

      // Switch to default first
      setInput("target-input", "default");
      fireEvent.click(screen.getByText("switch"));
      await waitFor(() => expect(getText("active-id")).toBe("default"));

      // Delete the temp layout
      const tempId = getText("layout-ids")
        .split(",")
        .find((id) => id !== "default")!;
      setInput("target-input", tempId);
      fireEvent.click(screen.getByText("delete"));
      await waitFor(() => expect(getText("layout-count")).toBe("1"));
    });

    test("deleting active layout falls back to default", async () => {
      renderProbe();

      setInput("name-input", "Active One");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("active-name")).toBe("Active One"));

      const activeId = getText("active-id");
      setInput("target-input", activeId);
      fireEvent.click(screen.getByText("delete"));

      await waitFor(() => {
        expect(getText("active-id")).toBe("default");
        expect(getText("layout-count")).toBe("1");
      });
    });

    test("cannot delete default layout", async () => {
      renderProbe();

      setInput("target-input", "default");
      fireEvent.click(screen.getByText("delete"));

      await waitFor(() => {
        expect(getText("layout-count")).toBe("1");
        expect(getText("active-id")).toBe("default");
      });
    });
  });

  describe("renameLayout", () => {
    test("renames layout with valid name", async () => {
      renderProbe();

      setInput("name-input", "Original");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("active-name")).toBe("Original"));

      const layoutId = getText("active-id");
      setInput("target-input", layoutId);
      setInput("name-input", "Renamed");
      fireEvent.click(screen.getByText("rename"));

      await waitFor(() => {
        expect(getText("rename-result")).toContain('"ok":true');
        expect(getText("active-name")).toBe("Renamed");
      });
    });

    test("rejects duplicate name (case-insensitive)", async () => {
      renderProbe();

      setInput("name-input", "Work");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("layout-count")).toBe("2"));

      const layoutId = getText("active-id");
      setInput("target-input", layoutId);
      setInput("name-input", "default");
      fireEvent.click(screen.getByText("rename"));

      await waitFor(() => {
        expect(getText("rename-result")).toContain("duplicate_name");
      });
    });

    test("rejects empty name", async () => {
      renderProbe();

      setInput("name-input", "ToRename");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("active-name")).toBe("ToRename"));

      const layoutId = getText("active-id");
      setInput("target-input", layoutId);
      setInput("name-input", "");
      fireEvent.click(screen.getByText("rename"));

      await waitFor(() => {
        expect(getText("rename-result")).toContain("empty_name");
      });
    });
  });

  describe("sync active layout edits to collection", () => {
    test("editing active layout persists across switch", async () => {
      renderProbe();
      setInput("name-input", "Synced");
      fireEvent.click(screen.getByText("save"));
      await waitFor(() => expect(getText("active-name")).toBe("Synced"));

      // Edit the grid
      fireEvent.click(screen.getByText("edit-grid"));
      await waitFor(() => expect(getText("first-widget-x")).toBe("77"));

      // Switch away and back
      setInput("target-input", "default");
      fireEvent.click(screen.getByText("switch"));
      await waitFor(() => expect(getText("active-id")).toBe("default"));

      const syncedId = getText("layout-ids")
        .split(",")
        .find((id) => id !== "default")!;
      setInput("target-input", syncedId);
      fireEvent.click(screen.getByText("switch"));
      await waitFor(() => expect(getText("first-widget-x")).toBe("77"));
    });
  });
});
