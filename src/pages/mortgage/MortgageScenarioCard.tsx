import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

interface MortgageScenarioCardProps {
  extraMonthlyPayment: string;
  oneTimeExtraPayment: string;
  annualExtraPayment: string;
  onChange: (next: {
    extraMonthlyPayment: string;
    oneTimeExtraPayment: string;
    annualExtraPayment: string;
  }) => void;
  monthsSaved: number;
  interestSaved: number;
  payoffDateBase?: string;
  payoffDateScenario?: string;
}

export function MortgageScenarioCard({
  extraMonthlyPayment,
  oneTimeExtraPayment,
  annualExtraPayment,
  onChange,
  monthsSaved,
  interestSaved,
  payoffDateBase,
  payoffDateScenario,
}: MortgageScenarioCardProps) {
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <h2 className="text-base font-semibold">Scenario simulator</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Extra monthly payment</Label>
          <Input
            value={extraMonthlyPayment}
            onChange={(e) =>
              onChange({
                extraMonthlyPayment: e.target.value,
                oneTimeExtraPayment,
                annualExtraPayment,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label>One-time extra payment</Label>
          <Input
            value={oneTimeExtraPayment}
            onChange={(e) =>
              onChange({
                extraMonthlyPayment,
                oneTimeExtraPayment: e.target.value,
                annualExtraPayment,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Annual extra payment</Label>
          <Input
            value={annualExtraPayment}
            onChange={(e) =>
              onChange({
                extraMonthlyPayment,
                oneTimeExtraPayment,
                annualExtraPayment: e.target.value,
              })
            }
          />
        </div>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground">Months saved</div>
          <div className="text-xl font-semibold">{monthsSaved}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground">Interest saved</div>
          <div className="text-xl font-semibold">{formatCurrency(interestSaved)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground">Base payoff date</div>
          <div className="font-medium">{payoffDateBase ?? "—"}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground">Scenario payoff date</div>
          <div className="font-medium">{payoffDateScenario ?? "—"}</div>
        </div>
      </div>
    </section>
  );
}
