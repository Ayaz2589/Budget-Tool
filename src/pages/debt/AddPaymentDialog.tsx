import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddPaymentPayload = {
  debtId: string;
  date: string;
  amount: number;
  note?: string;
};

export type AddPaymentDialogProps = {
  open: boolean;
  debtId: string | null;
  onClose: () => void;
  onSubmit: (payload: AddPaymentPayload) => void;
};

export function AddPaymentDialog({
  open,
  debtId,
  onClose,
  onSubmit,
}: AddPaymentDialogProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setNote("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtId) return;
    const num = parseFloat(amount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    onSubmit({
      debtId,
      date,
      amount: num,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make payment</DialogTitle>
          <DialogDescription>
            Record a payment toward this debt. Balance will update
            automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input
              placeholder="e.g. Monthly payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
