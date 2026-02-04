import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddMortgagePaymentDialogProps } from "@/types/mortgage";
import { CalendarIcon } from "lucide-react";

export type { AddMortgagePaymentDialogProps };

export function AddMortgagePaymentDialog({
  open,
  onOpenChange,
  date,
  onDateChange,
  amount,
  onAmountChange,
  owner,
  onOwnerChange,
  ownerOptions = [],
  onSubmit,
}: AddMortgagePaymentDialogProps) {
  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  const formatDateLabel = (value: string) => {
    if (!value) return "—";
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(dateObj);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col h-full w-[85vw] max-w-sm border-l p-4 gap-3 overflow-hidden rounded-l-2xl"
      >
        <SheetHeader className="gap-2">
          <SheetTitle>Add mortgage payment</SheetTitle>
          <SheetDescription>
            Enter the payment date and amount.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={selectTriggerClass}>
                    <span className="truncate">{formatDateLabel(date)}</span>
                    <CalendarIcon className="size-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-4 w-64">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select
                value={owner || "_none"}
                onValueChange={(v) => onOwnerChange(v === "_none" ? "" : v)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="No Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No Owner</SelectItem>
                  {ownerOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-11 flex-1">
              Add
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
