import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { searchSymbols } from "@/lib/marketData";
import type { InvestmentHolding, SymbolSearchResult } from "@/types/investments";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

interface HoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (holding: Omit<InvestmentHolding, "id">) => void;
  initialHolding?: InvestmentHolding | null;
  t: (key: string) => string;
}

export function HoldingDialog({
  open,
  onOpenChange,
  onSave,
  initialHolding,
  t,
}: HoldingDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [investedAmount, setInvestedAmount] = useState("0");
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialHolding) {
      setSymbol(initialHolding.symbol);
      setName(initialHolding.name ?? "");
      setQuantity(String(initialHolding.quantity));
      setInvestedAmount(String(initialHolding.investedAmount));
      setResults([]);
      return;
    }
    setSymbol("");
    setName("");
    setQuantity("1");
    setInvestedAmount("0");
    setResults([]);
  }, [initialHolding, open]);

  useEffect(() => {
    if (!open) return;
    if (symbol.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const handle = window.setTimeout(async () => {
      try {
        setSearching(true);
        const found = await searchSymbols(symbol);
        if (active) setResults(found);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [symbol, open]);

  const canSave = useMemo(() => {
    const q = Number(quantity);
    const amt = Number(investedAmount);
    return symbol.trim().length > 0 && Number.isFinite(q) && q > 0 && Number.isFinite(amt) && amt > 0;
  }, [investedAmount, quantity, symbol]);

  const save = () => {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const payload: Omit<InvestmentHolding, "id"> = {
      symbol: normalizedSymbol,
      name: name.trim() || undefined,
      quantity: Number(quantity),
      investedAmount: Number(investedAmount),
      currency: "USD",
      lots: [],
    };
    onSave(payload);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "top"}
        className={
          isDesktop
            ? "w-[720px] max-w-[90vw] p-0 flex flex-col"
            : "h-[calc(100vh-64px)] mt-0 rounded-none p-0 flex flex-col"
        }
      >
        <DsSheetHeader
          className="p-4"
          title={initialHolding ? t("investments.editHolding") : t("investments.addHolding")}
          description={t("investments.holdingDescription")}
        />
        <div className="flex-1 overflow-auto px-4 pt-4 pb-4 space-y-4">
          <div className="space-y-1">
            <Label>{t("investments.symbol")}</Label>
            <Input
              className="h-11"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
            />
            {searching && <p className="text-xs text-muted-foreground">{t("common.loading")}</p>}
            {!searching && results.length > 0 && (
              <div className="border rounded-md divide-y overflow-hidden">
                {results.map((result) => (
                  <button
                    key={`${result.symbol}-${result.name}`}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted"
                    onClick={() => {
                      setSymbol(result.symbol.toUpperCase());
                      setName(result.name);
                      setResults([]);
                    }}
                  >
                    <div className="text-sm font-medium">{result.symbol}</div>
                    <div className="text-xs text-muted-foreground">{result.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>{t("investments.name")}</Label>
            <Input
              className="h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("investments.companyOptional")}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("investments.quantity")}</Label>
              <Input
                className="h-11"
                type="number"
                min="0"
                step="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("investments.investedAmount")}</Label>
              <Input
                className="h-11"
                type="number"
                min="0"
                step="0.01"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DsSheetActions className="p-4 grid grid-cols-2 gap-2">
          <Button className="h-11 flex-1" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button className="h-11 flex-1" onClick={save} disabled={!canSave}>
            {t("common.save")}
          </Button>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}
