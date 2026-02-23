import { describe, test, expect } from "bun:test";
import { createElement, isValidElement } from "react";
import type { WidgetSize } from "@/types/widget";
import { createWidget } from "@/lib/createWidget";

const TEST_DIMS = {
  sm: { w: 3, h: 2 },
  md: { w: 6, h: 2 },
  lg: { w: 6, h: 3 },
};

const mockIcon = createElement("i", null, "icon");
const mockRender = (props: Record<string, unknown>, size: WidgetSize) =>
  createElement("div", null, `${String(props.name)}-${size}`);

function makeOpts(overrides?: Record<string, unknown>) {
  return {
    type: "net-cash-flow" as const,
    label: "widget.netCashFlow",
    icon: mockIcon,
    ...TEST_DIMS,
    render: mockRender,
    ...overrides,
  };
}

describe("createWidget", () => {
  describe("required fields", () => {
    test("returns an object with all WidgetRegistryEntry fields", () => {
      const entry = createWidget(makeOpts());
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("icon");
      expect(entry).toHaveProperty("defaultSize");
      expect(entry).toHaveProperty("sizeDims");
      expect(entry).toHaveProperty("render");
    });

    test("type matches input", () => {
      const entry = createWidget(makeOpts());
      expect(entry.type).toBe("net-cash-flow");
    });

    test("label matches input", () => {
      const entry = createWidget(makeOpts());
      expect(entry.label).toBe("widget.netCashFlow");
    });

    test("icon matches input", () => {
      const entry = createWidget(makeOpts());
      expect(entry.icon).toBe(mockIcon);
    });

    test("sizeDims assembled from flat sm/md/lg params", () => {
      const entry = createWidget(makeOpts());
      expect(entry.sizeDims).toEqual({
        sm: { w: 3, h: 2 },
        md: { w: 6, h: 2 },
        lg: { w: 6, h: 3 },
      });
    });

    test("render is a function", () => {
      const entry = createWidget(makeOpts());
      expect(typeof entry.render).toBe("function");
    });
  });

  describe("defaultSize", () => {
    test("defaults to 'md' when not specified", () => {
      const entry = createWidget(makeOpts());
      expect(entry.defaultSize).toBe("md");
    });

    test("uses provided defaultSize 'sm'", () => {
      const entry = createWidget(makeOpts({ defaultSize: "sm" }));
      expect(entry.defaultSize).toBe("sm");
    });

    test("uses provided defaultSize 'lg'", () => {
      const entry = createWidget(makeOpts({ defaultSize: "lg" }));
      expect(entry.defaultSize).toBe("lg");
    });
  });

  describe("render passthrough", () => {
    test("delegates to input render function", () => {
      const entry = createWidget(makeOpts());
      const result = entry.render({ name: "test" }, "md");
      expect(isValidElement(result)).toBe(true);
    });

    test("passes props and size through unchanged", () => {
      let capturedProps: Record<string, unknown> = {};
      let capturedSize: WidgetSize = "md";
      const spy = (props: Record<string, unknown>, size: WidgetSize) => {
        capturedProps = props;
        capturedSize = size;
        return createElement("span");
      };
      const entry = createWidget(makeOpts({ render: spy }));
      const testProps = { foo: "bar", count: 42 };
      entry.render(testProps, "lg");
      expect(capturedProps).toBe(testProps);
      expect(capturedSize).toBe("lg");
    });
  });

  describe("className wrapping", () => {
    test("no wrapper when className is omitted", () => {
      const inner = createElement("span", null, "hello");
      const entry = createWidget(makeOpts({ render: () => inner }));
      const result = entry.render({}, "md");
      expect(result).toBe(inner);
    });

    test("wraps render output in div with className when provided", () => {
      const inner = createElement("span", null, "hello");
      const entry = createWidget(
        makeOpts({ render: () => inner, className: "custom-class" }),
      );
      const result = entry.render({}, "md");
      expect(isValidElement(result)).toBe(true);
      const el = result as React.ReactElement<{ className: string }>;
      expect(el.type).toBe("div");
      expect(el.props.className).toBe("custom-class");
    });

    test("wrapped render still receives correct props and size", () => {
      let capturedSize: WidgetSize = "md";
      const spy = (_props: Record<string, unknown>, size: WidgetSize) => {
        capturedSize = size;
        return createElement("span");
      };
      const entry = createWidget(
        makeOpts({ render: spy, className: "test-class" }),
      );
      entry.render({ x: 1 }, "lg");
      expect(capturedSize).toBe("lg");
    });
  });

  describe("purity", () => {
    test("returns distinct objects from same args", () => {
      const opts = makeOpts();
      const a = createWidget(opts);
      const b = createWidget(opts);
      expect(a).not.toBe(b);
      expect(a.sizeDims).not.toBe(b.sizeDims);
    });

    test("does not mutate input options", () => {
      const opts = makeOpts();
      const frozen = { ...opts };
      createWidget(opts);
      expect(opts.type).toBe(frozen.type);
      expect(opts.label).toBe(frozen.label);
      expect(opts.sm).toEqual(frozen.sm);
      expect(opts.md).toEqual(frozen.md);
      expect(opts.lg).toEqual(frozen.lg);
    });
  });
});
