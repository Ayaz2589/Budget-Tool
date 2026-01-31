import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ExpenseCategoriesCardProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
};

export function ExpenseCategoriesCard({
  value,
  onChange,
  onSave,
}: ExpenseCategoriesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense categories</CardTitle>
        <CardDescription>
          Comma-separated list. Used in dropdowns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="My Purchase, Tasnuva's Purchases, 50/50, Amazon"
          className="min-w-0"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className="w-full sm:w-auto"
        >
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
