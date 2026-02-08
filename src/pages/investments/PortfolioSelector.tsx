import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvestmentPortfolio } from "@/types/investments";

interface PortfolioSelectorProps {
  portfolios: InvestmentPortfolio[];
  selectedPortfolioId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: () => void;
  onDelete: () => void;
  disabled?: boolean;
  t: (key: string) => string;
}

export function PortfolioSelector({
  portfolios,
  selectedPortfolioId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  disabled = false,
  t,
}: PortfolioSelectorProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Select
        value={selectedPortfolioId ?? ""}
        onValueChange={onSelect}
        disabled={portfolios.length === 0}
      >
        <SelectTrigger className="h-11 min-w-[220px]">
          <SelectValue placeholder={t("investments.selectPortfolio")} />
        </SelectTrigger>
        <SelectContent>
          {portfolios.map((portfolio) => (
            <SelectItem key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button className="h-11" onClick={onCreate} disabled={disabled}>
          {t("investments.newPortfolio")}
        </Button>
        <Button
          className="h-11"
          variant="outline"
          onClick={onRename}
          disabled={disabled || !selectedPortfolioId}
        >
          {t("common.edit")}
        </Button>
        <Button
          className="h-11"
          variant="destructive"
          onClick={onDelete}
          disabled={disabled || !selectedPortfolioId}
        >
          {t("common.delete")}
        </Button>
      </div>
    </div>
  );
}

