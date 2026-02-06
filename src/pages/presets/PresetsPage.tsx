import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import type { ExpenseSource } from "@/types/core";
import { SOURCE_OPTIONS } from "@/lib/sourceLabels";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PresetsPage() {
  const { t } = useTranslation();
  const { expenseCategories, cardSources, owners } = useBudget();
  const { presetTransactions, addPreset, removePreset } =
    usePresetTransactions();

  const sourceOptionsFiltered = useMemo(
    () => SOURCE_OPTIONS.filter((o) => cardSources.includes(o.value)),
    [cardSources]
  );
  const ownerOptions = useMemo(() => owners, [owners]);

  const [presetOpen, setPresetOpen] = useState(false);
  const [presetSource, setPresetSource] = useState<ExpenseSource>("manual");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetCategory, setPresetCategory] = useState(
    expenseCategories[0] ?? ""
  );
  const [presetMember, setPresetMember] = useState(ownerOptions[0] ?? "");
  const [presetToDeleteId, setPresetToDeleteId] = useState<string | null>(null);

  const handleAddPreset = () => {
    addPreset({
      source: presetSource,
      description: presetDescription.trim(),
      category: presetCategory,
      owner: presetMember,
    });
    setPresetSource("manual");
    setPresetDescription("");
    setPresetCategory(expenseCategories[0] ?? "");
    setPresetMember(ownerOptions[0] ?? "");
    setPresetOpen(false);
  };

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="hidden md:flex flex-wrap items-start justify-between gap-3 shrink-0 mb-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-semibold">{t("nav.presets")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("presetTransactions.description")}
          </p>
        </div>
        <Button
          onClick={() => setPresetOpen(true)}
          disabled={expenseCategories.length === 0}
        >
          <Plus className="size-4" />
          {t("presetTransactions.addPreset")}
        </Button>
      </div>
      <div className="md:hidden mb-3 px-4 pt-4 shrink-0 bg-background/95 backdrop-blur">
        <div className="px-0 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{t("nav.presets")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("presetTransactions.description")}
            </p>
          </div>
        </div>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
          <Sheet open={presetOpen} onOpenChange={setPresetOpen}>
            <SheetContent
              side="right"
              className="flex flex-col h-full w-[85vw] max-w-sm border-l p-4 gap-3 overflow-hidden rounded-l-2xl"
            >
              <SheetHeader>
                <SheetTitle>{t("presetTransactions.newPreset")}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-auto space-y-4">
                  <div className="space-y-2">
                    <Label>{t("presetTransactions.source")}</Label>
                    <Select
                      value={
                        cardSources.includes(presetSource)
                          ? presetSource
                          : (cardSources[0] as ExpenseSource)
                      }
                      onValueChange={(v) => setPresetSource(v as ExpenseSource)}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptionsFiltered.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("presetTransactions.descriptionLabel")}</Label>
                    <Input
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder={t("addTransaction.placeholderDescription")}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("presetTransactions.category")}</Label>
                    <Select
                      value={presetCategory}
                      onValueChange={setPresetCategory}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("common.owner")}</Label>
                    <Select
                      value={presetMember || "_none"}
                      onValueChange={(v) =>
                        setPresetMember(v === "_none" ? "" : v)
                      }
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">
                          {t("common.noOwner")}
                        </SelectItem>
                        {ownerOptions.map((member) => (
                          <SelectItem key={member} value={member}>
                            {member}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="h-11 flex-1"
                    onClick={() => setPresetOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button className="h-11 flex-1" onClick={handleAddPreset}>
                    {t("common.save")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {presetTransactions.length === 0 ? (
            <div className="text-sm text-muted-foreground px-4 md:px-0">
              {expenseCategories.length === 0
                ? t("presetTransactions.emptyNoCategories")
                : t("presetTransactions.empty")}
            </div>
          ) : (
            <div className="space-y-0">
              {presetTransactions.map((preset, index) => {
                const sourceLabel =
                  SOURCE_OPTIONS.find((o) => o.value === preset.source)?.label ??
                  preset.source;
                return (
                  <div key={preset.id} className="border-t border-border">
                    <div
                      className={`px-4 py-3 flex items-start gap-2 ${
                        index % 2 === 1 ? "bg-muted/30" : "bg-background"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-foreground truncate">
                          {sourceLabel}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {preset.description || "—"} · {preset.category} ·{" "}
                          {preset.owner || t("common.noOwner")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPresetToDeleteId(preset.id)}
                        aria-label={t("presetTransactions.delete")}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 px-4 pb-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-end">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/20 shadow-lg shadow-black/30 backdrop-blur px-2 py-2">
            <Button
              onClick={() => setPresetOpen(true)}
              className="h-11 w-11 rounded-full p-0"
              disabled={expenseCategories.length === 0}
              aria-label={t("presetTransactions.addPreset")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={presetToDeleteId !== null}
        onOpenChange={(open) => !open && setPresetToDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("presetTransactions.deletePresetTitle")}</DialogTitle>
            <DialogDescription>
              {t("presetTransactions.deletePresetDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPresetToDeleteId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (presetToDeleteId) {
                  removePreset(presetToDeleteId);
                  setPresetToDeleteId(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
