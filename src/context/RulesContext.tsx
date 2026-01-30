import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Rule } from "@/lib/rules";
import { generateRuleId } from "@/lib/rules";

const RULES_STORAGE_KEY = "budget-tool-rules";

interface RulesContextValue {
  rules: Rule[];
  addRule: (rule: Omit<Rule, "id">) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  removeRule: (id: string) => void;
  reorderRule: (id: string, direction: "up" | "down") => void;
  toggleRule: (id: string) => void;
  setRules: (rules: Rule[]) => void;
}

const RulesContext = createContext<RulesContextValue | null>(null);

export function RulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<Rule[]>(() => {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as Rule[];
      } catch {
        return [];
      }
    }
    return [];
  });

  const persist = useCallback((next: Rule[]) => {
    setRules(next);
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addRule = useCallback(
    (rule: Omit<Rule, "id">) => {
      persist([...rules, { ...rule, id: generateRuleId() }]);
    },
    [persist, rules],
  );

  const updateRule = useCallback(
    (id: string, updates: Partial<Rule>) => {
      const next = rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule,
      );
      persist(next);
    },
    [persist, rules],
  );

  const removeRule = useCallback(
    (id: string) => {
      persist(rules.filter((rule) => rule.id !== id));
    },
    [persist, rules],
  );

  const reorderRule = useCallback(
    (id: string, direction: "up" | "down") => {
      const index = rules.findIndex((rule) => rule.id === id);
      if (index === -1) return;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= rules.length) return;
      const next = [...rules];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved!);
      persist(next);
    },
    [persist, rules],
  );

  const toggleRule = useCallback(
    (id: string) => {
      const next = rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
      );
      persist(next);
    },
    [persist, rules],
  );

  const setRules = useCallback(
    (nextRules: Rule[]) => {
      persist(nextRules);
    },
    [persist],
  );

  const value = useMemo<RulesContextValue>(
    () => ({
      rules,
      addRule,
      updateRule,
      removeRule,
      reorderRule,
      toggleRule,
      setRules,
    }),
    [rules, addRule, updateRule, removeRule, reorderRule, toggleRule, setRules],
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
