import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";

export type AddRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: string;
  onPatternChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  expenseCategories: string[];
  onSubmit: (e: React.FormEvent) => void;
};

export function AddRuleDialog({
  open,
  onOpenChange,
  pattern,
  onPatternChange,
  category,
  onCategoryChange,
  expenseCategories,
  onSubmit,
}: AddRuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add rule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pattern (substring in description)</Label>
            <Input
              placeholder="e.g. UBER EATS"
              value={pattern}
              onChange={(e) => onPatternChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[220px] min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    <CategoryOption name={c} type="expense" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Add rule</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
