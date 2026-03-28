import { useTranslation } from "react-i18next";
import type { ExpenseSource, TransactionRow } from "@/types";
import {
  formatCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import {
  EXPENSE_SOURCE_BADGE_LABELS,
  EXPENSE_SOURCE_LOCALE_KEYS,
} from "@/lib/format/sourceLabels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DsCreatableSelect } from "@/components/ds";
import { DsCategoryPicker } from "@/components/ds/DsCategoryPicker";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PresetSelector } from "./PresetSelector";
import { AllocationEditor } from "./AllocationEditor";
import { TransferFields } from "./TransferFields";
import type { PresetTransaction } from "@/types/core";
import type { UiFormatSettings } from "@/lib/format";

type DateFormat = UiFormatSettings["dateFormat"];

interface TransactionFormRowProps {
  row: TransactionRow;
  onUpdate: (updates: Partial<TransactionRow>) => void;
  ownerOptions: string[];
  cardSources: string[];
  defaultSource: ExpenseSource;
  expenseCategories: string[];
  presetTransactions: PresetTransaction[];
  sortedPresetTransactions: PresetTransaction[];
  onPresetChange: (presetId: string) => void;
  dateFormat: DateFormat;
  fieldClass: string;
  selectTriggerClass: string;
  onCreateOwner?: (name: string) => void;
}

export function TransactionFormRow({
  row,
  onUpdate,
  ownerOptions,
  cardSources,
  defaultSource,
  expenseCategories,
  presetTransactions,
  sortedPresetTransactions,
  onPresetChange,
  dateFormat,
  fieldClass,
  selectTriggerClass,
  onCreateOwner,
}: TransactionFormRowProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-3 space-y-3">
      {/* Inline type + preset row */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="space-y-0.5">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.type", "Type")}
          </div>
          <Select
            value={row.entryType}
            onValueChange={(value) =>
              onUpdate({
                entryType: value as "expense" | "owner-transfer",
              })
            }
          >
            <SelectTrigger className="h-8 w-auto gap-1.5 text-xs px-2.5 data-[size=default]:h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">
                {t("transactions.typeExpense")}
              </SelectItem>
              <SelectItem value="owner-transfer">
                {t("transactions.typeTransfer")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {row.entryType !== "owner-transfer" &&
          presetTransactions.length > 0 &&
          expenseCategories.length > 0 && (
            <PresetSelector
              presetId={row.presetId}
              sortedPresetTransactions={sortedPresetTransactions}
              onPresetChange={onPresetChange}
              selectTriggerClass="h-8 w-auto gap-1.5 text-xs px-2.5 data-[size=default]:h-8"
            />
          )}
      </div>

      {/* Entry-type-specific fields */}
      {row.entryType === "owner-transfer" ? (
        <TransferFields
          row={row}
          onUpdate={onUpdate}
          ownerOptions={ownerOptions}
          dateFormat={dateFormat}
          fieldClass={fieldClass}
          selectTriggerClass={selectTriggerClass}
        />
      ) : (
        <ExpenseFields
          row={row}
          onUpdate={onUpdate}
          ownerOptions={ownerOptions}
          cardSources={cardSources}
          defaultSource={defaultSource}
          dateFormat={dateFormat}
          fieldClass={fieldClass}
          selectTriggerClass={selectTriggerClass}
          onCreateOwner={onCreateOwner}
          hasOwners={ownerOptions.length > 0}
        />
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--border-subtle)]" />
    </div>
  );
}

function ExpenseFields({
  row,
  onUpdate,
  ownerOptions,
  cardSources,
  defaultSource,
  dateFormat,
  fieldClass,
  selectTriggerClass,
  onCreateOwner,
  hasOwners,
}: {
  row: TransactionRow;
  onUpdate: (updates: Partial<TransactionRow>) => void;
  ownerOptions: string[];
  cardSources: string[];
  defaultSource: ExpenseSource;
  dateFormat: DateFormat;
  fieldClass: string;
  selectTriggerClass: string;
  onCreateOwner?: (name: string) => void;
  hasOwners: boolean;
}) {
  const { t } = useTranslation();

  const detailsPanel = (
    <section className="space-y-3">
      <SectionDivider label={t("addTransaction.details", "Details")} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.amount")}
          </div>
          <Input
            type="text"
            placeholder="0.00"
            className={fieldClass}
            value={row.amount}
            onChange={(e) =>
              onUpdate({
                amount: formatCurrencyInput(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.date")}
          </div>
          <DatePicker
            valueIso={dateInputToIso(row.date, dateFormat)}
            onChangeIso={(isoDate) =>
              onUpdate({
                date: isoToDateInput(isoDate, dateFormat),
              })
            }
            triggerLabel={row.date}
            placeholder={t("addTransaction.date")}
            triggerClassName={fieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.category")}
          </div>
          <DsCategoryPicker
            value={row.category}
            onValueChange={(v) => onUpdate({ category: v })}
            type="expense"
            className={selectTriggerClass}
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.source")}
          </div>
          <Select
            value={
              cardSources.includes(row.source)
                ? row.source
                : defaultSource
            }
            onValueChange={(v) =>
              onUpdate({ source: v as ExpenseSource })
            }
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cardSources.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                      {EXPENSE_SOURCE_BADGE_LABELS[s as ExpenseSource]}
                    </span>
                    {t(
                      `addTransaction.${
                        EXPENSE_SOURCE_LOCALE_KEYS[
                          s as ExpenseSource
                        ]
                      }`,
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">
          {t("addTransaction.description")}
        </div>
        <Input
          placeholder={t("addTransaction.placeholderDescription")}
          className={fieldClass}
          value={row.description}
          onChange={(e) =>
            onUpdate({ description: e.target.value })
          }
        />
      </div>
    </section>
  );

  const ownershipPanel = hasOwners ? (
    <section className="space-y-3">
      <SectionDivider label={t("addTransaction.whoPays", "Ownership")} />
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.paidBy")}
          </div>
          {onCreateOwner ? (
            <DsCreatableSelect
              value={row.paidByOwner || "_none"}
              onValueChange={(v) => {
                const nextOwner = v === "_none" ? "" : v;
                const nextAllocationOwners =
                  row.allocationMode === "single" && nextOwner
                    ? [nextOwner]
                    : row.allocationOwners;
                onUpdate({
                  owner: nextOwner,
                  paidByOwner: nextOwner,
                  allocationOwners: nextAllocationOwners,
                });
              }}
              options={ownerOptions}
              onCreateNew={onCreateOwner}
              noneLabel={t("common.noOwner")}
              noneValue="_none"
              className={selectTriggerClass}
            />
          ) : (
            <Select
              value={row.paidByOwner || "_none"}
              onValueChange={(v) => {
                const nextOwner = v === "_none" ? "" : v;
                const nextAllocationOwners =
                  row.allocationMode === "single" && nextOwner
                    ? [nextOwner]
                    : row.allocationOwners;
                onUpdate({
                  owner: nextOwner,
                  paidByOwner: nextOwner,
                  allocationOwners: nextAllocationOwners,
                });
              }}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder={t("common.noOwner")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                {ownerOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <AllocationEditor
          row={row}
          ownerOptions={ownerOptions}
          onUpdate={onUpdate}
          selectTriggerClass={selectTriggerClass}
          fieldClass={fieldClass}
        />
      </div>
    </section>
  ) : null;

  if (!hasOwners) {
    return <div className="space-y-4">{detailsPanel}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[3fr_auto_2fr] gap-6 md:gap-0">
      <div className="md:pr-6">{detailsPanel}</div>
      <div className="hidden md:block w-px bg-[var(--border-subtle)]" />
      <div className="md:pl-6">{ownershipPanel}</div>
    </div>
  );
}
