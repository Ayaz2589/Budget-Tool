import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CategoryRule } from "@/lib/categoryRules";
import { generateRuleId } from "@/lib/categoryRules";

const RULES_STORAGE_KEY = "budget-tool-category-rules";

interface RulesContextValue {
  rules: CategoryRule[];
  addRule: (rule: Omit<CategoryRule, "id">) => void;
  removeRule: (id: string) => void;
  updateRule: (id: string, updates: Partial<CategoryRule>) => void;
}

const RulesContext = createContext<RulesContextValue | null>(null);

export function RulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<CategoryRule[]>(() => {
    try {
      const raw = localStorage.getItem(RULES_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CategoryRule[];
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
    } catch {
      // ignore
    }
  }, [rules]);

  const addRule = useCallback((rule: Omit<CategoryRule, "id">) => {
    setRules((prev) => [...prev, { ...rule, id: generateRuleId() }]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRule = useCallback(
    (id: string, updates: Partial<CategoryRule>) => {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
    },
    [],
  );

  const value = useMemo<RulesContextValue>(
    () => ({ rules, addRule, removeRule, updateRule }),
    [rules, addRule, removeRule, updateRule],
  );

  return (
    <RulesContext.Provider value={value}>{children}</RulesContext.Provider>
  );
}

export function useRules() {
  const ctx = useContext(RulesContext);
  if (!ctx) throw new Error("useRules must be used within RulesProvider");
  return ctx;
}
