import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Expense, ExpenseSource } from "@/types/core";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { formatUsdInput, parseUsdInput } from "@/lib/currencyInput";
import { SourceIcon } from "@/components/cards";
import { CategoryOption } from "@/lib/categoryColors";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface EditTransactionDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<Expense>) => void;
  expenseCategories: string[];
  ownerOptions: string[];
  cardSources: string[];
}

export function EditTransactionDialog({
  expense,
  onClose,
  onSubmit,
  expenseCategories,
  ownerOptions,
  cardSources,
}: EditTransactionDialogProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<ExpenseSource>("manual");
  const [category, setCategory] = useState("");
  const [owner, setOwner] = useState("");

  useEffect(() => {
    if (!expense) return;
    setDate(expense.date);
    setAmount(formatUsdInput(String(expense.amount)));
    setDescription(expense.description);
    setSource(expense.source);
    setCategory(expense.category || "");
    setOwner(expense.owner || "");
  }, [expense]);

  const availableSources = useMemo<ExpenseSource[]>(
    () => cardSources as ExpenseSource[],
    [cardSources],
  );

  if (!expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseUsdInput(amount);
    if (Number.isNaN(num) || num <= 0) return;
    onSubmit(expense.id, {
      date: date.trim(),
      amount: num,
      description: description.trim() || t("addTransaction.transaction"),
      source,
      category: category || "",
      owner: owner || undefined,
    });
    onClose();
  };

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col h-full w-[85vw] max-w-sm border-l p-4 gap-3 overflow-hidden rounded-l-2xl"
      >
        <SheetHeader className="gap-2">
          <SheetTitle>{t("common.edit")} {t("addTransaction.transaction")}</SheetTitle>
          <SheetDescription>
            {t("transactions.subtitle")}
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto space-y-4">
            <div className="space-y-2">
              <Label>{t("addTransaction.source")}</Label>
              <Select
                value={availableSources.includes(source) ? source : (availableSources[0] ?? "manual")}
                onValueChange={(v) => setSource(v as ExpenseSource)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <SourceIcon source={s} size={18} />
                        {t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS[s]}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.date")}</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                pattern="\d{4}-\d{2}-\d{2}"
                maxLength={10}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.amount")}</Label>
              <Input
                type="text"
                placeholder="$0.00"
                value={amount}
                onChange={(e) => setAmount(formatUsdInput(e.target.value))}
                className={fieldClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.description")}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("addTransaction.placeholderDescription")}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.category")}</Label>
              <Select
                value={category || "_"}
                onValueChange={(v) => setCategory(v === "_" ? "" : v)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">
                    <CategoryOption name={t("common.uncategorized")} type="expense" />
                  </SelectItem>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      <CategoryOption name={c} type="expense" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.owner")}</Label>
              <Select
                value={owner || "_none"}
                onValueChange={(v) => setOwner(v === "_none" ? "" : v)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
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
              onClick={onClose}
              className="h-11 flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="h-11 flex-1">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
