import { useEffect, useState } from "react";
import {
  applyTheme,
  getStoredTheme,
  onSystemThemeChange,
  persistTheme,
  type AppTheme,
} from "@/lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(getStoredTheme);

  useEffect(() => {
    persistTheme(theme);
    if (theme !== "system") return;
    const unsubscribe = onSystemThemeChange(() => applyTheme("system"));
    return unsubscribe;
  }, [theme]);

  return {
    theme,
    setTheme: setThemeState,
  };
}
