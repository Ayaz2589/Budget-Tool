import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import type { ExpenseSource } from "@/types/core";
import { getCategoryColor } from "@/lib/categoryColors";
import { SOURCE_OPTIONS } from "@/lib/sourceLabels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-semibold">{t("nav.presets")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("presetTransactions.description")}
          </p>
        </div>
      </div>

      <Card data-tour="presets">
        <CardHeader>
          <CardTitle>{t("presetTransactions.title")}</CardTitle>
          <CardDescription>
            {t("presetTransactions.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Dialog open={presetOpen} onOpenChange={setPresetOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={expenseCategories.length === 0}
              >
                <Plus className="size-4" />
                {t("presetTransactions.addPreset")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("presetTransactions.newPreset")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                    <SelectTrigger className="w-full">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("presetTransactions.category")}</Label>
                  <Select
                    value={presetCategory}
                    onValueChange={setPresetCategory}
                  >
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                      {ownerOptions.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPresetOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleAddPreset}>{t("common.save")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {presetTransactions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {expenseCategories.length === 0
                ? t("presetTransactions.emptyNoCategories")
                : t("presetTransactions.empty")}
            </div>
          ) : (
            presetTransactions.map((preset) => {
              const sourceLabel =
                SOURCE_OPTIONS.find((o) => o.value === preset.source)?.label ??
                preset.source;
              return (
                <div
                  key={preset.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="text-sm flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{sourceLabel}</span>
                    {preset.description ? (
                      <span className="text-muted-foreground">
                        {" — "}
                        {preset.description}
                      </span>
                    ) : null}
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {" · "}
                      <span
                        className={`size-2 shrink-0 rounded-full ${getCategoryColor(
                          preset.category,
                          "expense"
                        )}`}
                        aria-hidden
                      />
                      {preset.category} · {preset.owner || t("common.noOwner")}
                    </span>
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
              );
            })
          )}
        </CardContent>
      </Card>

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
