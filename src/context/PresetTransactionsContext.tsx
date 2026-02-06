import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { PresetTransaction } from "@/types/core";
import type { PresetTransactionsContextValue } from "@/types/context";

const PRESET_STORAGE_KEY = "budget-tool-preset-transactions";

function generatePresetId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const PresetTransactionsContext =
  createContext<PresetTransactionsContextValue | null>(null);

export function PresetTransactionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [presetTransactions, setPresetTransactions] = useState<
    PresetTransaction[]
  >(() => {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PresetTransaction[];
        return parsed.map((p) => ({
          ...p,
          owner:
            (p as PresetTransaction & { cardMember?: string }).owner ??
            (p as PresetTransaction & { cardMember?: string }).cardMember ??
            "",
          amount: (() => {
            const raw = (p as PresetTransaction & { amount?: unknown }).amount;
            if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
            const parsed = Number(raw);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
          })(),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const persist = useCallback((next: PresetTransaction[]) => {
    setPresetTransactions(next);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addPreset = useCallback(
    (preset: Omit<PresetTransaction, "id">) => {
      persist([...presetTransactions, { ...preset, id: generatePresetId() }]);
    },
    [persist, presetTransactions]
  );

  const removePreset = useCallback(
    (id: string) => {
      persist(presetTransactions.filter((p) => p.id !== id));
    },
    [persist, presetTransactions]
  );

  const updatePreset = useCallback(
    (id: string, updates: Partial<Omit<PresetTransaction, "id">>) => {
      persist(
        presetTransactions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [persist, presetTransactions]
  );

  const setPresets = useCallback(
    (presets: PresetTransaction[]) => {
      persist(presets);
    },
    [persist]
  );

  const value = useMemo<PresetTransactionsContextValue>(
    () => ({
      presetTransactions,
      addPreset,
      updatePreset,
      removePreset,
      setPresets,
    }),
    [presetTransactions, addPreset, updatePreset, removePreset, setPresets]
  );

  return (
    <PresetTransactionsContext.Provider value={value}>
      {children}
    </PresetTransactionsContext.Provider>
  );
}

export function usePresetTransactions() {
  const ctx = useContext(PresetTransactionsContext);
  if (!ctx)
    throw new Error(
      "usePresetTransactions must be used within PresetTransactionsProvider"
    );
  return ctx;
}
