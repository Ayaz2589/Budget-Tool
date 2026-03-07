import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useBudget } from "@/context";
import { usePresetTransactions } from "@/context";
import type { ExpenseSource, PresetTransaction } from "@/types/core";
import {
  EXPENSE_SOURCE_BADGE_LABELS,
  EXPENSE_SOURCE_LOCALE_KEYS,
} from "@/lib/format/sourceLabels";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format/currencyInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
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
import { cn } from "@/lib/utils";
import {
  DsActionBar,
  DsCreatableSelect,
  DsDataRow,
  DsEmptyState,
  DsSectionHeader,
  DsSheetActions,
  DsSheetHeader,
} from "@/components/ds";

export function PresetsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { expenseCategories, setExpenseCategories, cardSources, owners, setOwners } = useBudget();
  const { presetTransactions, addPreset, removePreset, setPresets } =
    usePresetTransactions();

  const sourceOptionsFiltered = useMemo(
    () =>
      cardSources
        .filter((value): value is ExpenseSource => value in EXPENSE_SOURCE_LOCALE_KEYS)
        .map((value) => ({
          value,
          label: t(`transactions.${EXPENSE_SOURCE_LOCALE_KEYS[value]}`),
        })),
    [cardSources, t]
  );
  const ownerOptions = useMemo(() => owners, [owners]);

  const [presetOpen, setPresetOpen] = useState(false);
  const [presetSource, setPresetSource] = useState<ExpenseSource>("manual");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetAmount, setPresetAmount] = useState("");
  const [presetCategory, setPresetCategory] = useState(
    expenseCategories[0] ?? ""
  );
  const [presetMember, setPresetMember] = useState(ownerOptions[0] ?? "");
  const [presetToDeleteId, setPresetToDeleteId] = useState<string | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetForActions, setPresetForActions] =
    useState<PresetTransaction | null>(null);
  const [openCategory, setOpenCategory] = useState<string>("");

  const groupedPresets = useMemo(() => {
    const map = new Map<string, typeof presetTransactions>();
    for (const p of presetTransactions) {
      const key = p.category || t("common.uncategorized");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, presets]) => [
        category,
        [...presets].sort((a, b) =>
          (a.description || "").localeCompare(b.description || "")
        ),
      ] as const);
  }, [presetTransactions, t]);

  const desktopPresets = useMemo(
    () => groupedPresets.flatMap(([, presets]) => presets),
    [groupedPresets]
  );

  const resetForm = () => {
    setPresetSource("manual");
    setPresetDescription("");
    setPresetAmount("");
    setPresetCategory(expenseCategories[0] ?? "");
    setPresetMember(ownerOptions[0] ?? "");
    setEditingPresetId(null);
  };

  const openForNew = () => {
    resetForm();
    setPresetOpen(true);
  };

  const openForEdit = (presetId: string) => {
    const preset = presetTransactions.find((p) => p.id === presetId);
    if (!preset) return;
    setEditingPresetId(preset.id);
    setPresetSource(preset.source);
    setPresetDescription(preset.description);
    setPresetAmount(
      typeof preset.amount === "number" && Number.isFinite(preset.amount)
        ? formatCurrencyFromNumber(preset.amount)
        : ""
    );
    setPresetCategory(preset.category);
    setPresetMember(preset.owner || "");
    setPresetOpen(true);
  };

  const handleSavePreset = () => {
    const parsedAmount = presetAmount.trim()
      ? parseCurrencyInput(presetAmount)
      : undefined;
    const normalizedAmount =
      typeof parsedAmount === "number" && Number.isFinite(parsedAmount) && parsedAmount >= 0
        ? parsedAmount
        : undefined;

    const payload = {
      source: presetSource,
      description: presetDescription.trim(),
      amount: normalizedAmount,
      category: presetCategory,
      owner: presetMember,
    };

    if (editingPresetId) {
      setPresets(
        presetTransactions.map((p) =>
          p.id === editingPresetId ? { ...p, ...payload } : p
        )
      );
    } else {
      addPreset(payload);
    }
    resetForm();
    setPresetOpen(false);
  };

  const getSourceLabel = (source: ExpenseSource) =>
    t(`transactions.${EXPENSE_SOURCE_LOCALE_KEYS[source]}`);

  const getSourceBadge = (source: ExpenseSource) => {
    switch (source) {
      case "amex":
        return "AMEX";
      case "amex-gold":
        return "AMEX";
      case "apple":
        return "MC";
      case "visa":
        return "VISA";
      case "sapphire":
        return "SAPPHIRE";
      case "bank-of-america":
        return "BOA";
      case "wells-fargo":
        return "WF";
      case "chase":
        return "CHASE";
      case "manual":
        return "MANUAL";
      case "td":
        return "TD";
      default:
        return String(source).toUpperCase();
    }
  };

  useEffect(() => {
    if (
      openCategory &&
      groupedPresets.some(([categoryName]) => categoryName === openCategory)
    ) {
      return;
    }
    setOpenCategory(groupedPresets[0]?.[0] ?? "");
  }, [groupedPresets, openCategory]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setPresetOpen(params.get("tourSheet") === "presets-add");
  }, [location.search]);

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  return (
    <div data-tour-page="presets" className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("nav.presets")}
          subtitle={t("presetTransactions.description")}
          showCurrencyChip
          actions={undefined}
        />
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent data-tour="presets-table" className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
          <Sheet open={presetOpen} onOpenChange={setPresetOpen}>
            <SheetContent
              side="right"
              desktopVariant="modal"
              desktopModalSize="compact"
              data-tour="presets-add-sheet"
              className="flex flex-col p-4 gap-3 overflow-hidden"
            >
              <DsSheetHeader
                className="-mx-4 -mt-4 mb-1"
                title={
                  editingPresetId
                    ? `${t("common.edit")} ${t("presetTransactions.newPreset").toLowerCase()}`
                    : t("presetTransactions.newPreset")
                }
              />
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
                            <span className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                                {EXPENSE_SOURCE_BADGE_LABELS[opt.value]}
                              </span>
                              {opt.label}
                            </span>
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
                    <Label>{t("common.amount")}</Label>
                    <Input
                      value={presetAmount}
                      onChange={(e) =>
                        setPresetAmount(formatCurrencyInput(e.target.value))
                      }
                      placeholder={t("presetTransactions.amountOptional")}
                      inputMode="decimal"
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("presetTransactions.category")}</Label>
                    <DsCreatableSelect
                      value={presetCategory}
                      onValueChange={setPresetCategory}
                      options={expenseCategories}
                      onCreateNew={(name) => {
                        if (!expenseCategories.includes(name)) {
                          setExpenseCategories([...expenseCategories, name]);
                        }
                      }}
                      className={selectTriggerClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("common.owner")}</Label>
                    <DsCreatableSelect
                      value={presetMember || "_none"}
                      onValueChange={(v) =>
                        setPresetMember(v === "_none" ? "" : v)
                      }
                      options={ownerOptions}
                      onCreateNew={(name) => {
                        if (!owners.includes(name)) {
                          setOwners([...owners, name]);
                        }
                      }}
                      noneLabel={t("common.noOwner")}
                      noneValue="_none"
                      className={selectTriggerClass}
                    />
                  </div>
                </div>
                <DsSheetActions className="-mx-4 -mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPresetOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button className="flex-1" onClick={handleSavePreset}>
                      {t("common.save")}
                    </Button>
                  </div>
                </DsSheetActions>
              </div>
            </SheetContent>
          </Sheet>

          {presetTransactions.length === 0 ? (
            <DsEmptyState
              title={
                expenseCategories.length === 0
                  ? t("presetTransactions.emptyNoCategories")
                  : t("presetTransactions.empty")
              }
              description={
                expenseCategories.length === 0
                  ? t("presetTransactions.emptyNoCategoriesHint")
                  : t("presetTransactions.emptyHint")
              }
              className="py-6"
              actions={
                expenseCategories.length === 0 ? (
                  <Button variant="secondary" onClick={() => navigate("/dashboard/settings")}>
                    {t("presetTransactions.goToSettings")}
                  </Button>
                ) : (
                  <Button onClick={openForNew}>
                    <Plus className="size-4" />
                    {t("presetTransactions.addPreset")}
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table density="comfortable">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.description")}</TableHead>
                      <TableHead>{t("common.source")}</TableHead>
                      <TableHead>{t("common.amount")}</TableHead>
                      <TableHead>{t("common.owner")}</TableHead>
                      <TableHead>{t("common.category")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {desktopPresets.map((preset, index) => {
                      const sourceLabel = getSourceLabel(preset.source);
                      const amountLabel =
                        typeof preset.amount === "number"
                          ? formatCurrencyFromNumber(preset.amount)
                          : "—";
                      return (
                        <TableRow
                          key={preset.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setPresetForActions(preset)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setPresetForActions(preset);
                            }
                          }}
                          className={cn(
                            "cursor-pointer [&>td]:py-4",
                            index % 2 === 1 ? "bg-muted/30" : undefined
                          )}
                          aria-label={`${preset.description || "Preset"}, ${sourceLabel}, ${amountLabel}, ${
                            preset.owner || t("common.noOwner")
                          }`}
                        >
                          <TableCell className="max-w-[260px] truncate font-medium">
                            {preset.description || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                                {EXPENSE_SOURCE_BADGE_LABELS[preset.source]}
                              </span>
                              {sourceLabel}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {amountLabel}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {preset.owner || t("common.noOwner")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {preset.category || t("common.uncategorized")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden">
                <div className="space-y-3 px-3 pb-2">
                  {groupedPresets.map(([categoryName, presets]) => {
                    const isOpen = openCategory === categoryName;
                    const categoryTotal = presets.reduce(
                      (sum, preset) => sum + (typeof preset.amount === "number" ? preset.amount : 0),
                      0,
                    );
                    return (
                      <section
                        key={categoryName}
                        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenCategory(isOpen ? "" : categoryName)
                          }
                          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                          aria-expanded={isOpen}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-none">
                              {categoryName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {presets.length === 1
                                ? t("transactions.transaction_one", { count: 1 })
                                : t("transactions.transaction_other", {
                                    count: presets.length,
                                  })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrencyFromNumber(categoryTotal)}
                            </span>
                            <ChevronDown
                              className={cn(
                                "size-4 text-muted-foreground transition-transform",
                                isOpen ? "rotate-180" : "rotate-0"
                              )}
                            />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="divide-y divide-border/70 border-t border-border/70">
                            {presets.map((preset, index) => {
                              const amountLabel =
                                typeof preset.amount === "number"
                                  ? formatCurrencyFromNumber(preset.amount)
                                  : "";
                              return (
                                <div
                                  key={preset.id}
                                  className={cn(index % 2 === 1 ? "bg-muted/20" : "bg-card")}
                                >
                                  <DsDataRow
                                    dense
                                    onClick={() => setPresetForActions(preset)}
                                    title={preset.description || "—"}
                                    subtitle={`${preset.owner || t("common.noOwner")} · ${preset.category || t("common.uncategorized")}`}
                                    trailing={
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="inline-flex items-center justify-center rounded-md bg-[var(--surface-2)] text-[10px] px-2 py-0.5 text-muted-foreground">
                                          {getSourceBadge(preset.source)}
                                        </span>
                                        {amountLabel ? (
                                          <div className="text-base font-semibold">{amountLabel}</div>
                                        ) : null}
                                      </div>
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DsActionBar mobileOnly={false}>
            <Button
              onClick={openForNew}
              density="compact"
              className="rounded-full p-0"
              size="icon"
              disabled={expenseCategories.length === 0}
              aria-label={t("presetTransactions.addPreset")}
            >
              <Plus className="size-4" />
            </Button>
      </DsActionBar>

      <Sheet
        open={presetForActions !== null}
        onOpenChange={(open) => !open && setPresetForActions(null)}
      >
        <SheetContent
          side="right"
          desktopVariant="modal"
          showCloseButton={true}
          className="flex flex-col p-0 gap-0 overflow-hidden"
        >
          {presetForActions ? (
            <>
              <DsSheetHeader title={presetForActions.description || "—"} />
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
                <div className="grid gap-5">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                      <span>{t("common.source")}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                          {EXPENSE_SOURCE_BADGE_LABELS[presetForActions.source]}
                        </span>
                        {getSourceLabel(presetForActions.source)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {t("common.amount")}
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        {typeof presetForActions.amount === "number"
                          ? formatCurrencyFromNumber(presetForActions.amount)
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      {t("common.category")}
                    </Label>
                    <div className="h-11 px-3 border rounded-md bg-background flex items-center text-sm">
                      {presetForActions.category || t("common.uncategorized")}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      {t("common.owner")}
                    </Label>
                    <div className="h-11 px-3 border rounded-md bg-background flex items-center text-sm">
                      {presetForActions.owner || t("common.noOwner")}
                    </div>
                  </div>
                </div>
              </div>
              <DsSheetActions>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPresetForActions(null);
                      openForEdit(presetForActions.id);
                    }}
                  >
                    <Pencil className="size-4" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setPresetToDeleteId(presetForActions.id);
                      setPresetForActions(null);
                    }}
                  >
                    <Trash2 className="size-4" />
                    {t("common.delete")}
                  </Button>
                </div>
              </DsSheetActions>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

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
