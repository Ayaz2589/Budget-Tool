import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Lock, Trash2 } from "lucide-react";
import type { CategoryRule } from "@/lib/categoryRules";
import { BASELINE_RULES_READONLY } from "@/lib/categoryRules";
import { CategoryOption } from "@/lib/categoryColors";

export type RulesTableProps = {
  baselineRules: readonly { id: string; pattern: string; category: string }[];
  customRules: CategoryRule[];
  onRemoveRule: (id: string) => void;
};

export function RulesTable({
  baselineRules,
  customRules,
  onRemoveRule,
}: RulesTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pattern</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {baselineRules.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {r.pattern}
              </TableCell>
              <TableCell>
                <CategoryOption name={r.category} type="expense" />
              </TableCell>
              <TableCell className="w-[80px]">
                <span title="Built-in rule (cannot be removed)">
                  <Lock className="size-4 text-muted-foreground" />
                </span>
              </TableCell>
            </TableRow>
          ))}
          {customRules.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground py-8"
              >
                No custom rules. Add one to auto-categorize imports.
              </TableCell>
            </TableRow>
          ) : (
            customRules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.pattern}</TableCell>
                <TableCell>
                  <CategoryOption name={r.category} type="expense" />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveRule(r.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
