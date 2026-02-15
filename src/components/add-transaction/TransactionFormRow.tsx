import { useTranslation } from "react-i18next";
import type { ExpenseSource, TransactionRow } from "@/types";
import {
  formatCurrencyInput,
} from "@/lib/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/dateInput";
import {
  EXPENSE_SOURCE_BADGE_LABELS,
  EXPENSE_SOURCE_LOCALE_KEYS,
} from "@/lib/sourceLabels";
import { CategoryOption } from "@/lib/categoryColors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}: TransactionFormRowProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-border/60">
      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {t("transactions.type")}
        </div>
        <Select
          value={row.entryType}
          onValueChange={(value) =>
            onUpdate({
              entryType: value as "expense" | "owner-transfer",
            })
          }
        >
          <SelectTrigger className={selectTriggerClass}>
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
          expenseCategories={expenseCategories}
          presetTransactions={presetTransactions}
          sortedPresetTransactions={sortedPresetTransactions}
          onPresetChange={onPresetChange}
          dateFormat={dateFormat}
          fieldClass={fieldClass}
          selectTriggerClass={selectTriggerClass}
        />
      )}
    </div>
  );
}

function ExpenseFields({
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
}: {
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
}) {
  const { t } = useTranslation();

  return (
    <>
      {presetTransactions.length > 0 &&
        expenseCategories.length > 0 && (
          <PresetSelector
            presetId={row.presetId}
            sortedPresetTransactions={sortedPresetTransactions}
            onPresetChange={onPresetChange}
            selectTriggerClass={selectTriggerClass}
          />
        )}

      <div className="space-y-0.5">
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

      <div className="space-y-0.5">
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

      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {t("addTransaction.amount")}
        </div>
        <Input
          type="text"
          placeholder={t("addTransaction.placeholderAmount")}
          className={fieldClass}
          value={row.amount}
          onChange={(e) =>
            onUpdate({
              amount: formatCurrencyInput(e.target.value),
            })
          }
        />
      </div>

      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {t("addTransaction.category")}
        </div>
        <Select
          value={row.category || "_"}
          onValueChange={(v) =>
            onUpdate({ category: v === "_" ? "" : v })
          }
        >
          <SelectTrigger className={selectTriggerClass}>
            <SelectValue placeholder="\u2014" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">
              <CategoryOption
                name={t("addTransaction.uncategorized")}
                type="expense"
              />
            </SelectItem>
            {expenseCategories.map((c) => (
              <SelectItem key={c} value={c}>
                <CategoryOption name={c} type="expense" />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
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

      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {t("addTransaction.paidBy")}
        </div>
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
      </div>

      <AllocationEditor
        row={row}
        ownerOptions={ownerOptions}
        onUpdate={onUpdate}
        selectTriggerClass={selectTriggerClass}
        fieldClass={fieldClass}
      />
    </>
  );
}
