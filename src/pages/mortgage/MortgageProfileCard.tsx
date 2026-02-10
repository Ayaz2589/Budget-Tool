import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/currencyInput";
import type { MortgageProfile } from "@/types/mortgage";

interface MortgageProfileCardProps {
  profile?: MortgageProfile;
  onCreate: (profile: Omit<MortgageProfile, "id" | "createdAt" | "updatedAt">) => void;
  onSave: (updates: Partial<MortgageProfile>) => void;
  onDelete: () => void;
}

function toNumberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toCurrencyOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = parseCurrencyInput(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function MortgageProfileCard({
  profile,
  onCreate,
  onSave,
  onDelete,
}: MortgageProfileCardProps) {
  const initial = useMemo(
    () => ({
      name: profile?.name ?? "Primary Mortgage",
      currentBalance: formatCurrencyFromNumber(profile?.currentBalance ?? 0),
      interestRateAnnual: String(profile?.interestRateAnnual ?? 0),
      loanType: profile?.loanType ?? "fixed",
      maturityDate: profile?.maturityDate ?? "",
      remainingTermMonths: profile?.remainingTermMonths
        ? String(profile.remainingTermMonths)
        : "",
      monthlyPaymentTarget: profile?.monthlyPaymentTarget
        ? formatCurrencyFromNumber(profile.monthlyPaymentTarget)
        : "",
      annualPropertyTax: profile?.annualPropertyTax
        ? formatCurrencyFromNumber(profile.annualPropertyTax)
        : "",
      annualInsurance: profile?.annualInsurance
        ? formatCurrencyFromNumber(profile.annualInsurance)
        : "",
    }),
    [profile]
  );
  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const save = () => {
    const payload = {
      name: form.name.trim() || "Primary Mortgage",
      currentBalance: Math.max(0, parseCurrencyInput(form.currentBalance) || 0),
      interestRateAnnual: Math.max(0, Number(form.interestRateAnnual) || 0),
      loanType: form.loanType === "variable" ? "variable" : "fixed",
      maturityDate: form.maturityDate || undefined,
      remainingTermMonths: toNumberOrUndefined(form.remainingTermMonths),
      monthlyPaymentTarget: toCurrencyOrUndefined(form.monthlyPaymentTarget),
      annualPropertyTax: toCurrencyOrUndefined(form.annualPropertyTax),
      annualInsurance: toCurrencyOrUndefined(form.annualInsurance),
    } as const;
    if (profile) {
      onSave(payload);
      return;
    }
    onCreate(payload);
  };

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Current balance</Label>
          <Input
            value={form.currentBalance}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                currentBalance: formatCurrencyInput(e.target.value),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Interest rate %</Label>
          <Input
            value={form.interestRateAnnual}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, interestRateAnnual: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Loan type</Label>
          <Select
            value={form.loanType}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                loanType: value === "variable" ? "variable" : "fixed",
              }))
            }
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="variable">Variable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Maturity date</Label>
          <Input
            type="date"
            value={form.maturityDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, maturityDate: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Remaining months</Label>
          <Input
            value={form.remainingTermMonths}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, remainingTermMonths: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Monthly payment target</Label>
          <Input
            value={form.monthlyPaymentTarget}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                monthlyPaymentTarget: formatCurrencyInput(e.target.value),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Annual property tax</Label>
          <Input
            value={form.annualPropertyTax}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                annualPropertyTax: formatCurrencyInput(e.target.value),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Annual insurance</Label>
          <Input
            value={form.annualInsurance}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                annualInsurance: formatCurrencyInput(e.target.value),
              }))
            }
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={save}>{profile ? "Save profile" : "Create profile"}</Button>
        {profile ? (
          <Button variant="destructive" onClick={onDelete}>
            Delete profile
          </Button>
        ) : null}
      </div>
    </section>
  );
}
