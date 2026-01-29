import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Accordion } from "@/components/ui/accordion";
import { SpendingByTypeSection } from "@/pages/dashboard/SpendingByTypeSection";
import type { ChartConfig } from "@/components/ui/chart";

const mockT = (key: string) => key;
const emptyConfig: ChartConfig = {};

test("SpendingByTypeSection shows Spending by type accordion trigger", () => {
  render(
    <Accordion type="single" collapsible>
      <SpendingByTypeSection
        fiftyFiftyByType={[]}
        mySpendingByType={[]}
        tasnuvasSpendingByType={[]}
        fiftyFiftyChartConfig={emptyConfig}
        mySpendingChartConfig={emptyConfig}
        tasnuvasSpendingChartConfig={emptyConfig}
        t={mockT}
      />
    </Accordion>,
  );
  expect(screen.getByText("dashboard.spendingByType")).toBeInTheDocument();
});
