import {
  LayoutDashboard,
  Database,
  List,
  Wallet,
  CreditCard,
  Home,
  ListOrdered,
  Settings,
  CircleHelp,
} from "lucide-react";

export const nav = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/dashboard/transactions", labelKey: "nav.transactions", icon: List },
  { to: "/dashboard/income", labelKey: "nav.income", icon: Wallet },
  { to: "/dashboard/debt", labelKey: "nav.debt", icon: CreditCard },
  { to: "/dashboard/mortgage", labelKey: "nav.mortgage", icon: Home },
  { to: "/dashboard/presets", labelKey: "nav.presets", icon: ListOrdered },
  { to: "/dashboard/import", labelKey: "nav.import", icon: Database },
  { to: "/dashboard/about", labelKey: "nav.about", icon: CircleHelp },
  { to: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
] as const;

/** Primary tabs shown in mobile bottom nav */
export const bottomNavItems = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/dashboard/transactions", labelKey: "nav.transactions", icon: List },
  { to: "/dashboard/income", labelKey: "nav.income", icon: Wallet },
] as const;

/** Links shown in the "More" bottom sheet (rest of nav) */
export const moreNavItems = [
  { to: "/dashboard/debt", labelKey: "nav.debt", icon: CreditCard },
  { to: "/dashboard/mortgage", labelKey: "nav.mortgage", icon: Home },
  { to: "/dashboard/presets", labelKey: "nav.presets", icon: ListOrdered },
  { to: "/dashboard/import", labelKey: "nav.import", icon: Database },
  { to: "/dashboard/about", labelKey: "nav.about", icon: CircleHelp },
  { to: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Espa\u00F1ol" },
  { value: "bn", label: "\u09AC\u09BE\u0982\u09B2\u09BE" },
  { value: "zh", label: "\u4E2D\u6587" },
  { value: "ko", label: "\uD55C\uAD6D\uC5B4" },
  { value: "hi", label: "\u0939\u093F\u0928\u094D\u0926\u0940" },
  { value: "ja", label: "\u65E5\u672C\u8A9E" },
] as const;
