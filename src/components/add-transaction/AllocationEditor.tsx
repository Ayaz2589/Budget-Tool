import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransactionRow } from "@/types";
import { uniqueOwners } from "../add-transaction-utils";

interface AllocationEditorProps {
  row: TransactionRow;
  ownerOptions: string[];
  onUpdate: (updates: Partial<TransactionRow>) => void;
  selectTriggerClass: string;
  fieldClass: string;
}

export function AllocationEditor({
  row,
  ownerOptions,
  onUpdate,
  selectTriggerClass,
  fieldClass,
}: AllocationEditorProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {t("addTransaction.splitMode")}
        </div>
        <Select
          value={row.allocationMode}
          onValueChange={(value) => {
            const nextMode = value as "single" | "equal" | "custom";
            const paidByOwner = row.paidByOwner || row.owner;
            const defaultOwners =
              nextMode === "single"
                ? [paidByOwner || row.allocationOwners[0] || ownerOptions[0] || ""].filter(Boolean)
                : nextMode === "equal"
                  ? ownerOptions.length > 0
                    ? ownerOptions
                    : row.allocationOwners
                  : row.allocationOwners.length > 0
                    ? row.allocationOwners
                    : paidByOwner
                      ? [paidByOwner]
                      : ownerOptions.slice(0, 2);
            onUpdate({
              allocationMode: nextMode,
              allocationOwners: uniqueOwners(defaultOwners),
            });
          }}
        >
          <SelectTrigger className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">{t("addTransaction.splitSingle")}</SelectItem>
            <SelectItem value="equal">{t("addTransaction.splitEqual")}</SelectItem>
            <SelectItem value="custom">{t("addTransaction.splitCustom")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {row.allocationMode === "single" ? (
        <div className="space-y-0.5">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.splitOwner")}
          </div>
          <Select
            value={row.allocationOwners[0] || "_none"}
            onValueChange={(value) =>
              onUpdate({
                allocationOwners: value === "_none" ? [] : [value],
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
      ) : (
        <div className="space-y-1 md:col-span-2">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.splitOwners")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ownerOptions.map((name) => {
              const isSelected = row.allocationOwners.includes(name);
              return (
                <Button
                  key={name}
                  type="button"
                  variant={isSelected ? "secondary" : "outline"}
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => {
                    const next = isSelected
                      ? row.allocationOwners.filter((value) => value !== name)
                      : [...row.allocationOwners, name];
                    onUpdate({
                      allocationOwners: uniqueOwners(next),
                    });
                  }}
                >
                  {name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {row.allocationMode === "custom" ? (
        <div className="space-y-2 md:col-span-3">
          <div className="text-xs text-muted-foreground">
            {t("addTransaction.customSplitHint")}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {row.allocationOwners.map((name) => (
              <div key={name} className="space-y-0.5">
                <div className="text-xs text-muted-foreground">{name}</div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className={fieldClass}
                  value={row.allocationPercents[name] ?? ""}
                  onChange={(event) =>
                    onUpdate({
                      allocationPercents: {
                        ...row.allocationPercents,
                        [name]: event.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
