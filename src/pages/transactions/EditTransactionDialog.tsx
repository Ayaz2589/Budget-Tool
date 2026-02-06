import { useEffect, useMemo, useState } from "react";
import type { ExpenseSource } from "@/types/core";
import type { EditTransactionDialogProps } from "@/types/transactions";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { CategoryOption } from "@/lib/categoryColors";
import { SourceIcon } from "@/components/cards";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";

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
  const [category, setCategory] = useState("");
  const [source, setSource] = useState<ExpenseSource>("manual");
  const [owner, setOwner] = useState("");

  useEffect(() => {
    if (!expense) return;
    setDate(expense.date);
    setAmount(expense.amount.toFixed(2));
    setDescription(expense.description ?? "");
    setCategory(expense.category ?? "");
    setSource(expense.source);
    setOwner(expense.owner ?? "");
  }, [expense]);

  const effectiveSource = useMemo<ExpenseSource>(() => {
    if (cardSources.includes(source)) return source;
    return (cardSources[0] as ExpenseSource) ?? "manual";
  }, [cardSources, source]);

  const handleSave = () => {
    if (!expense) return;
    const parsed = parseFloat(amount.replace(/[$,]/g, ""));
    if (Number.isNaN(parsed) || parsed <= 0) return;
    onSubmit(expense.id, {
      date,
      amount: parsed,
      description: description.trim(),
      category,
      source: effectiveSource,
      owner: owner.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={true}
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl overflow-y-auto"
      >
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="text-left pr-8 break-words text-xl leading-snug">
            {t("common.edit")}
          </SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 px-4 pb-6 overflow-y-auto">
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
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("common.amount")}</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("common.description")}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("common.source")}</Label>
            <Select
              value={effectiveSource}
              onValueChange={(v) => setSource(v as ExpenseSource)}
            >
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cardSources.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <SourceIcon source={s as ExpenseSource} size={18} />
                      {t(
                        `addTransaction.${
                          EXPENSE_SOURCE_LOCALE_KEYS[s as ExpenseSource]
                        }`,
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("common.category")}</Label>
            <Select
              value={category || "_"}
              onValueChange={(v) => setCategory(v === "_" ? "" : v)}
            >
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
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
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
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
        <SheetFooter className="px-4 pb-4 pt-2 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="h-11" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" className="h-11" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
