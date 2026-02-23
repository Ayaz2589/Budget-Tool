import { useTranslation } from "react-i18next";
import type { TransactionRow } from "@/types";
import {
  formatCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import type { UiFormatSettings } from "@/lib/format";

type DateFormat = UiFormatSettings["dateFormat"];

interface TransferFieldsProps {
  row: TransactionRow;
  onUpdate: (updates: Partial<TransactionRow>) => void;
  ownerOptions: string[];
  dateFormat: DateFormat;
  fieldClass: string;
  selectTriggerClass: string;
}

export function TransferFields({
  row,
  onUpdate,
  ownerOptions,
  dateFormat,
  fieldClass,
  selectTriggerClass,
}: TransferFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
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
          {t("transactions.transferFrom")}
        </div>
        <Select
          value={row.transferFromOwner || "_none"}
          onValueChange={(value) =>
            onUpdate({
              transferFromOwner: value === "_none" ? "" : value,
            })
          }
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
      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {t("transactions.transferTo")}
        </div>
        <Select
          value={row.transferToOwner || "_none"}
          onValueChange={(value) =>
            onUpdate({
              transferToOwner: value === "_none" ? "" : value,
            })
          }
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
      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {t("transactions.transferNote")}
        </div>
        <Input
          placeholder={t("common.note")}
          className={fieldClass}
          value={row.transferNote}
          onChange={(e) =>
            onUpdate({ transferNote: e.target.value })
          }
        />
      </div>
      {row.transferFromOwner &&
      row.transferToOwner &&
      row.transferFromOwner === row.transferToOwner ? (
        <p className="text-xs text-destructive">
          {t("transactions.transferValidationOwnersDifferent")}
        </p>
      ) : null}
    </>
  );
}
