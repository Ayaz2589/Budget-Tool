import type { ExpenseSource } from "./core";

export interface SourceIconProps {
  source: ExpenseSource;
  size?: number;
  className?: string;
}

export interface AppleCardIconProps {
  className?: string;
  size?: number;
}

export interface AmexPlatinumCardIconProps {
  className?: string;
  size?: number;
}

export interface AmexGoldCardIconProps {
  className?: string;
  size?: number;
}
