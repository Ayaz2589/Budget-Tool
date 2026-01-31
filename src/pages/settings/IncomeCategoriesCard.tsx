import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type IncomeCategoriesCardProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
};

export function IncomeCategoriesCard({
  value,
  onChange,
  onSave,
}: IncomeCategoriesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income categories</CardTitle>
        <CardDescription>
          Comma-separated list for income entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rent, Paycheck, Bonus, ..."
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
