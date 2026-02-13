import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  List,
  Wallet,
  CreditCard,
  Home,
  ListOrdered,
  Settings,
  LogIn,
  LogOut,
  Landmark,
  Globe,
  ChevronDown,
  MoreHorizontal,
  CircleHelp,
} from "lucide-react";
import { useGoogleAuth } from "@/context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { persistLocale } from "@/i18n";
import i18n from "@/i18n";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";
import { SheetSetupDialog } from "@/components/SheetSetupDialog";
import { AppGuidedTour, type AppTourStep } from "@/components/AppGuidedTour";
import { MobileGuidedTour } from "@/components/MobileGuidedTour";
import {
  DsSidebarBrand,
  DsSidebarNavItem,
  DS_SIDEBAR_LANGUAGE_TRIGGER_CLASS,
  DS_SIDEBAR_ACCOUNT_TRIGGER_CLASS,
} from "@/components/ds";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const APP_TOUR_COMPLETED_KEY = "budget-tool-app-tour-completed";

function Avatar({
  userProfile,
}: {
  userProfile: { name: string; picture: string; email: string };
}) {
  const [imageError, setImageError] = useState(false);
  const initials = userProfile.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (imageError) {
    return (
      <div
        className="size-8 rounded-full shrink-0 bg-primary/20 text-primary flex items-center justify-center text-xs font-medium"
        title={userProfile.email}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={userProfile.picture}
      alt=""
      referrerPolicy="no-referrer"
      className="size-8 rounded-full shrink-0 object-cover bg-muted"
      onError={() => setImageError(true)}
    />
  );
}

const nav = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/dashboard/transactions", labelKey: "nav.transactions", icon: List },
  { to: "/dashboard/income", labelKey: "nav.income", icon: Wallet },
  { to: "/dashboard/debt", labelKey: "nav.debt", icon: CreditCard },
  { to: "/dashboard/mortgage", labelKey: "nav.mortgage", icon: Home },
  { to: "/dashboard/presets", labelKey: "nav.presets", icon: ListOrdered },
  { to: "/dashboard/import", labelKey: "nav.import", icon: Database },
  { to: "/dashboard/about", labelKey: "nav.about", icon: CircleHelp },
  { to: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
];

/** Primary tabs shown in mobile bottom nav */
const bottomNavItems = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/dashboard/transactions", labelKey: "nav.transactions", icon: List },
  { to: "/dashboard/income", labelKey: "nav.income", icon: Wallet },
];

/** Links shown in the "More" bottom sheet (rest of nav) */
const moreNavItems = [
  { to: "/dashboard/debt", labelKey: "nav.debt", icon: CreditCard },
  { to: "/dashboard/mortgage", labelKey: "nav.mortgage", icon: Home },
  { to: "/dashboard/presets", labelKey: "nav.presets", icon: ListOrdered },
  { to: "/dashboard/import", labelKey: "nav.import", icon: Database },
  { to: "/dashboard/about", labelKey: "nav.about", icon: CircleHelp },
  { to: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "bn", label: "বাংলা" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
  { value: "hi", label: "हिन्दी" },
  { value: "ja", label: "日本語" },
] as const;

function SidebarContent({
  location,
  t,
  currentLng,
  handleLanguageChange,
  isSignedIn,
  userProfile,
  signIn,
  signOut,
  onNavClick,
}: {
  location: ReturnType<typeof useLocation>;
  t: (key: string) => string;
  currentLng: string;
  handleLanguageChange: (locale: string) => void;
  isSignedIn: boolean;
  userProfile: { name: string; picture: string; email: string } | null;
  signIn: () => void;
  signOut: () => void;
  onNavClick?: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const isActivePath = (to: string) => {
    if (to === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <>
      <DsSidebarBrand
        title={t("layout.appName")}
        to="/dashboard"
        onClick={onNavClick}
      />
      <div className="flex flex-1 md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible md:overflow-y-auto pt-1">
        {nav.map(({ to, labelKey, icon: Icon }) => (
          <DsSidebarNavItem
            key={to}
            to={to}
            label={t(labelKey)}
            icon={Icon}
            onClick={onNavClick}
            active={isActivePath(to)}
          />
        ))}
      </div>
      <div className="shrink-0 mt-3 pt-3">
        <div className="px-1">
          <Select value={currentLng} onValueChange={handleLanguageChange}>
            <SelectTrigger className={DS_SIDEBAR_LANGUAGE_TRIGGER_CLASS}>
              <Globe className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]!">
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="shrink-0 pt-3 mt-3 md:mt-auto flex flex-col gap-2">
        {isSignedIn ? (
          <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={DS_SIDEBAR_ACCOUNT_TRIGGER_CLASS}
                aria-label={userProfile?.email ?? t("layout.loading")}
              >
                {userProfile ? (
                  <>
                    <Avatar userProfile={userProfile} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
                      {userProfile.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="size-8 rounded-full shrink-0 bg-muted" />
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {t("layout.loading")}
                    </span>
                  </>
                )}
                <ChevronDown className="size-4 shrink-0 text-[var(--text-secondary)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 min-h-0 w-full justify-start gap-2 text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--interactive-danger)]"
                onClick={() => {
                  setAccountMenuOpen(false);
                  signOut();
                }}
              >
                <LogOut className="size-4" />
                {t("layout.signOut")}
              </Button>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 whitespace-normal text-left text-xs leading-snug h-auto py-2"
            onClick={signIn}
          >
            <LogIn className="size-4" />
            {t("layout.signIn")}
          </Button>
        )}
      </div>
    </>
  );
}

export function Layout() {
  const MIN_SYNCING_VISIBLE_MS = 1200;
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const {
    isSignedIn,
    userProfile,
    signIn,
    signOut,
    spreadsheetId,
    syncStatus,
    hasUnsyncedChanges,
    sheetSetupState,
    availableDriveSheets,
    runSheetAutoSetup,
    linkDriveSheet,
    createOrthoDriveSheet,
    dismissSheetSetupPrompt,
  } = useGoogleAuth();
  const currentLng = i18n.language;
  const showSyncStatusUi = location.pathname !== "/dashboard";
  const [moreOpen, setMoreOpen] = useState(false);
  const isActivePath = (to: string) => {
    if (to === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };
  const [showSyncComplete, setShowSyncComplete] = useState(false);
  const [appTourOpen, setAppTourOpen] = useState(false);
  const [appTourStepIndex, setAppTourStepIndex] = useState(0);
  const [hasObservedSheetSetupFlow, setHasObservedSheetSetupFlow] =
    useState(false);
  const hasInitializedTourRef = useRef(false);
  const prevSignedInRef = useRef(isSignedIn);
  const syncingStartedAtRef = useRef<number | null>(null);
  const delayedCompleteTimerRef = useRef<number | null>(null);
  const isSheetSetupDialogOpen =
    isSignedIn &&
    !spreadsheetId &&
    sheetSetupState !== "idle" &&
    sheetSetupState !== "done";

  const desktopAppTourSteps = useMemo<AppTourStep[]>(
    () => [
      { route: "/dashboard", selector: '[data-tour=\"dashboard-header\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboard.title"), description: t("appTour.steps.dashboard.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-kpis\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardKpis.title"), description: t("appTour.steps.dashboardKpis.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-trends\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardTrends.title"), description: t("appTour.steps.dashboardTrends.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-pies\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardPies.title"), description: t("appTour.steps.dashboardPies.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-expense-by-owner\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardExpenseByOwner.title"), description: t("appTour.steps.dashboardExpenseByOwner.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-debt-snapshot\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardDebtSnapshot.title"), description: t("appTour.steps.dashboardDebtSnapshot.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-spend-by-source\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardSpendBySource.title"), description: t("appTour.steps.dashboardSpendBySource.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-owner-transfers\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardOwnerTransfers.title"), description: t("appTour.steps.dashboardOwnerTransfers.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-recent-activity\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardRecentActivity.title"), description: t("appTour.steps.dashboardRecentActivity.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-insights\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardInsights.title"), description: t("appTour.steps.dashboardInsights.description") },
      { route: "/dashboard?tourSheet=dashboard-settings", selector: '[data-tour=\"dashboard-settings-sheet\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardSettings.title"), description: t("appTour.steps.dashboardSettings.description") },
      { route: "/dashboard/transactions", selector: '[data-tour=\"transactions-table\"]', fallbackSelector: '[data-tour-page=\"transactions\"]', title: t("appTour.steps.transactions.title"), description: t("appTour.steps.transactions.description") },
      { route: "/dashboard/transactions?tourSheet=transactions-add", selector: '[data-tour=\"transactions-add-sheet\"]', fallbackSelector: '[data-tour-page=\"transactions\"]', title: t("appTour.steps.transactionsAdd.title"), description: t("appTour.steps.transactionsAdd.description") },
      { route: "/dashboard/transactions?tourSheet=transactions-filters", selector: '[data-tour=\"transactions-filters-sheet\"]', fallbackSelector: '[data-tour-page=\"transactions\"]', title: t("appTour.steps.transactionsFilters.title"), description: t("appTour.steps.transactionsFilters.description") },
      { route: "/dashboard/income", selector: '[data-tour=\"income-table\"]', fallbackSelector: '[data-tour-page=\"income\"]', title: t("appTour.steps.income.title"), description: t("appTour.steps.income.description") },
      { route: "/dashboard/income?tourSheet=income-add", selector: '[data-tour=\"income-add-sheet\"]', fallbackSelector: '[data-tour-page=\"income\"]', title: t("appTour.steps.incomeAdd.title"), description: t("appTour.steps.incomeAdd.description") },
      { route: "/dashboard/debt", selector: '[data-tour=\"debt-table\"]', fallbackSelector: '[data-tour-page=\"debt\"]', title: t("appTour.steps.debt.title"), description: t("appTour.steps.debt.description") },
      { route: "/dashboard/debt?tourSheet=debt-add", selector: '[data-tour=\"debt-add-sheet\"]', fallbackSelector: '[data-tour-page=\"debt\"]', title: t("appTour.steps.debtAdd.title"), description: t("appTour.steps.debtAdd.description") },
      { route: "/dashboard/mortgage", selector: '[data-tour=\"mortgage-table\"]', fallbackSelector: '[data-tour-page=\"mortgage\"]', title: t("appTour.steps.mortgage.title"), description: t("appTour.steps.mortgage.description") },
      { route: "/dashboard/mortgage?tourSheet=mortgage-add", selector: '[data-tour=\"mortgage-add-sheet\"]', fallbackSelector: '[data-tour-page=\"mortgage\"]', title: t("appTour.steps.mortgageAdd.title"), description: t("appTour.steps.mortgageAdd.description") },
      { route: "/dashboard/presets", selector: '[data-tour=\"presets-table\"]', fallbackSelector: '[data-tour-page=\"presets\"]', title: t("appTour.steps.presets.title"), description: t("appTour.steps.presets.description") },
      { route: "/dashboard/presets?tourSheet=presets-add", selector: '[data-tour=\"presets-add-sheet\"]', fallbackSelector: '[data-tour-page=\"presets\"]', title: t("appTour.steps.presetsAdd.title"), description: t("appTour.steps.presetsAdd.description") },
      { route: "/dashboard/import", selector: '[data-tour=\"data-page\"]', fallbackSelector: '[data-tour-page=\"data\"]', title: t("appTour.steps.data.title"), description: t("appTour.steps.data.description") },
      { route: "/dashboard/settings", selector: '[data-tour=\"settings-page\"]', fallbackSelector: '[data-tour-page=\"settings\"]', title: t("appTour.steps.settings.title"), description: t("appTour.steps.settings.description") },
    ],
    [t],
  );

  const mobileAppTourSteps = useMemo<AppTourStep[]>(
    () => [
      { route: "/dashboard", selector: '[data-tour=\"dashboard-header\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboard.title"), description: t("appTour.steps.dashboard.description") },
      { route: "/dashboard", selector: '[data-tour=\"dashboard-header\"]', fallbackSelector: '[data-tour-page=\"dashboard\"]', title: t("appTour.steps.dashboardSettings.title"), description: t("appTour.steps.dashboardSettings.description") },
      { route: "/dashboard/transactions", selector: '[data-tour=\"transactions-table\"]', fallbackSelector: '[data-tour-page=\"transactions\"]', title: t("appTour.steps.transactions.title"), description: t("appTour.steps.transactions.description") },
      { route: "/dashboard/transactions", selector: '[data-tour=\"transactions-table\"]', fallbackSelector: '[data-tour-page=\"transactions\"]', title: t("appTour.steps.transactionsFilters.title"), description: t("appTour.steps.transactionsFilters.description") },
      { route: "/dashboard/income", selector: '[data-tour=\"income-table\"]', fallbackSelector: '[data-tour-page=\"income\"]', title: t("appTour.steps.income.title"), description: t("appTour.steps.income.description") },
      { route: "/dashboard/debt", selector: '[data-tour=\"debt-table\"]', fallbackSelector: '[data-tour-page=\"debt\"]', title: t("appTour.steps.debt.title"), description: t("appTour.steps.debt.description") },
      { route: "/dashboard/mortgage", selector: '[data-tour=\"mortgage-table\"]', fallbackSelector: '[data-tour-page=\"mortgage\"]', title: t("appTour.steps.mortgage.title"), description: t("appTour.steps.mortgage.description") },
      { route: "/dashboard/presets", selector: '[data-tour=\"presets-table\"]', fallbackSelector: '[data-tour-page=\"presets\"]', title: t("appTour.steps.presets.title"), description: t("appTour.steps.presets.description") },
      { route: "/dashboard/import", selector: '[data-tour=\"data-page\"]', fallbackSelector: '[data-tour-page=\"data\"]', title: t("appTour.steps.data.title"), description: t("appTour.steps.data.description") },
      { route: "/dashboard/settings", selector: '[data-tour=\"settings-page\"]', fallbackSelector: '[data-tour-page=\"settings\"]', title: t("appTour.steps.settings.title"), description: t("appTour.steps.settings.description") },
    ],
    [t],
  );

  const appTourSteps = isDesktop ? desktopAppTourSteps : mobileAppTourSteps;

  useEffect(() => {
    if (prevSignedInRef.current && !isSignedIn) {
      navigate("/auth");
    }
    prevSignedInRef.current = isSignedIn;
  }, [isSignedIn, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (!isSignedIn || !spreadsheetId) {
      syncingStartedAtRef.current = null;
      setShowSyncComplete(false);
      if (delayedCompleteTimerRef.current != null) {
        window.clearTimeout(delayedCompleteTimerRef.current);
        delayedCompleteTimerRef.current = null;
      }
      return;
    }

    if (syncStatus === "syncing") {
      syncingStartedAtRef.current = Date.now();
      setShowSyncComplete(false);
      if (delayedCompleteTimerRef.current != null) {
        window.clearTimeout(delayedCompleteTimerRef.current);
        delayedCompleteTimerRef.current = null;
      }
      return;
    }

    if (syncStatus === "success") {
      const startedAt = syncingStartedAtRef.current;
      const elapsed = startedAt == null ? MIN_SYNCING_VISIBLE_MS : Date.now() - startedAt;
      const remaining = Math.max(0, MIN_SYNCING_VISIBLE_MS - elapsed);
      if (delayedCompleteTimerRef.current != null) {
        window.clearTimeout(delayedCompleteTimerRef.current);
      }
      delayedCompleteTimerRef.current = window.setTimeout(() => {
        setShowSyncComplete(true);
        delayedCompleteTimerRef.current = null;
      }, remaining);
      return;
    }

    if (syncStatus === "error") {
      syncingStartedAtRef.current = null;
      setShowSyncComplete(false);
      if (delayedCompleteTimerRef.current != null) {
        window.clearTimeout(delayedCompleteTimerRef.current);
        delayedCompleteTimerRef.current = null;
      }
    }
  }, [isSignedIn, spreadsheetId, syncStatus]);

  useEffect(() => {
    if (!showSyncComplete) return;
    const timeout = window.setTimeout(() => setShowSyncComplete(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [showSyncComplete]);

  useEffect(
    () => () => {
      if (delayedCompleteTimerRef.current != null) {
        window.clearTimeout(delayedCompleteTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!isSignedIn) {
      setHasObservedSheetSetupFlow(false);
      return;
    }
    if (spreadsheetId) {
      setHasObservedSheetSetupFlow(true);
      return;
    }
    if (isSheetSetupDialogOpen) {
      setHasObservedSheetSetupFlow(true);
    }
  }, [isSignedIn, spreadsheetId, isSheetSetupDialogOpen]);

  useEffect(() => {
    if (hasInitializedTourRef.current) return;
    if (!isSignedIn) return;
    if (location.pathname !== "/dashboard") return;
    if (!spreadsheetId) {
      // For first-time users without a linked sheet, start the app tour only
      // after they finish the sheet setup decision (link or not now).
      if (!hasObservedSheetSetupFlow) return;
      if (isSheetSetupDialogOpen) return;
    }
    hasInitializedTourRef.current = true;
    try {
      const completed = localStorage.getItem(APP_TOUR_COMPLETED_KEY) === "1";
      if (!completed) {
        setAppTourStepIndex(0);
        setAppTourOpen(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [
    isSignedIn,
    location.pathname,
    spreadsheetId,
    hasObservedSheetSetupFlow,
    isSheetSetupDialogOpen,
  ]);

  useEffect(() => {
    if (!appTourOpen) return;
    const step = appTourSteps[appTourStepIndex];
    if (!step) return;
    const current = `${location.pathname}${location.search}`;
    if (current !== step.route) {
      navigate(step.route, { replace: true });
    }
  }, [appTourOpen, appTourStepIndex, appTourSteps, location.pathname, location.search, navigate]);

  const handleLanguageChange = (locale: string) => {
    i18n.changeLanguage(locale);
    persistLocale(locale);
  };

  const completeAppTour = () => {
    try {
      localStorage.setItem(APP_TOUR_COMPLETED_KEY, "1");
    } catch {
      // ignore storage errors
    }
    setAppTourOpen(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header: logo + app name only */}
      <header className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border-b bg-muted/30 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="size-5 text-primary" />
          </div>
          <span className="font-semibold text-base tracking-tight truncate">
            {t("layout.appName")}
          </span>
        </Link>
      </header>

      {/* Desktop sidebar: fixed width so it doesn't change with language */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 border-r border-[var(--border-subtle)] bg-[var(--surface-1)]/92 p-3 flex-col gap-1 w-[220px] overflow-hidden backdrop-blur-sm shadow-[1px_0_10px_rgba(15,23,42,0.08)] dark:shadow-[1px_0_12px_rgba(0,0,0,0.24)]">
        <SidebarContent
          location={location}
          t={t}
          currentLng={currentLng}
          handleLanguageChange={handleLanguageChange}
          isSignedIn={isSignedIn}
          userProfile={userProfile}
          signIn={signIn}
          signOut={signOut}
        />
      </nav>
      <main
        className={cn(
          "flex-1 flex flex-col pb-[calc(6.25rem+env(safe-area-inset-bottom))] md:pb-6 md:ml-[220px] md:w-[calc(100%-220px)]",
          location.pathname === "/dashboard/transactions" ||
            location.pathname === "/dashboard/income" ||
            location.pathname === "/dashboard/debt" ||
            location.pathname === "/dashboard/mortgage" ||
            location.pathname === "/dashboard/presets" ||
            location.pathname === "/dashboard/import" ||
            location.pathname === "/dashboard/settings"
            ? "p-0 md:p-6"
            : "p-0 md:p-6",
          location.pathname !== "/dashboard" && "flatten-mobile-cards",
        )}
      >
        <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--border-subtle)] bg-[var(--surface-0)]/95 backdrop-blur supports-backdrop-filter:bg-[var(--surface-0)]/80 py-3.5 min-h-[84px] safe-area-pb"
        aria-label={t("layout.navigation")}
      >
        {bottomNavItems.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-1.5 rounded-md text-xs font-medium transition-colors min-w-0 flex-1 max-w-[33%] ds-label",
              isActivePath(to)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="truncate w-full text-center">{t(labelKey)}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-1.5 rounded-md text-xs font-medium transition-colors min-w-0 flex-1 max-w-[33%] text-muted-foreground hover:text-foreground ds-label",
            moreNavItems.some(({ to }) => isActivePath(to))
              ? "text-primary"
              : "",
          )}
          aria-label={t("layout.more")}
        >
          <MoreHorizontal className="size-5 shrink-0" />
          <span className="truncate w-full text-center">
            {t("layout.more")}
          </span>
        </button>
      </nav>

      {/* More: bottom sheet on mobile */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent
          showCloseButton={true}
          className="fixed bottom-0 left-0 right-0 top-auto z-50 w-full max-w-full max-h-[85vh] translate-x-0 translate-y-0 rounded-t-2xl border-t p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        >
          <DialogTitle className="sr-only">{t("layout.more")}</DialogTitle>
          <div className="overflow-y-auto overscroll-contain p-4 pb-8 flex flex-col gap-2">
            {moreNavItems.map(({ to, labelKey, icon: Icon }) => (
              <DialogClose asChild key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-control)] text-sm font-medium border border-transparent transition-colors",
                    isActivePath(to)
                      ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)] border-[var(--interactive-primary)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--control-hover)] hover:border-[var(--border-subtle)]",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {t(labelKey)}
                </Link>
              </DialogClose>
            ))}
            <div className="my-2 pt-2 flex flex-col gap-2">
              <div className="px-2 text-xs font-medium text-muted-foreground">
                {t("layout.language")}
              </div>
              <Select value={currentLng} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-9 w-full">
                  <Globe className="size-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]!">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              {isSignedIn ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1 min-w-0">
                    {userProfile ? (
                      <>
                        <Avatar userProfile={userProfile} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
                          {userProfile.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="size-8 rounded-full shrink-0 bg-muted" />
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                          {t("layout.loading")}
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--interactive-danger)]"
                    onClick={() => {
                      signOut();
                      setMoreOpen(false);
                    }}
                  >
                    <LogOut className="size-4" />
                    {t("layout.signOut")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 whitespace-normal text-left text-xs leading-snug h-auto py-2"
                  onClick={() => {
                    signIn();
                    setMoreOpen(false);
                  }}
                >
                  <LogIn className="size-4" />
                  {t("layout.signIn")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {showSyncStatusUi && (
        <SyncStatusIndicator
          hasUnsyncedChanges={hasUnsyncedChanges}
          syncStatus={syncStatus}
          showSyncComplete={showSyncComplete}
        />
      )}
      <SheetSetupDialog
        isSignedIn={isSignedIn}
        spreadsheetId={spreadsheetId}
        sheetSetupState={sheetSetupState}
        availableDriveSheets={availableDriveSheets}
        runSheetAutoSetup={runSheetAutoSetup}
        linkDriveSheet={linkDriveSheet}
        createOrthoDriveSheet={createOrthoDriveSheet}
        dismissSheetSetupPrompt={dismissSheetSetupPrompt}
      />
      <AppGuidedTour
        open={appTourOpen && isDesktop}
        stepIndex={appTourStepIndex}
        steps={appTourSteps}
        onBack={() => setAppTourStepIndex((prev) => Math.max(0, prev - 1))}
        onNext={() =>
          setAppTourStepIndex((prev) =>
            Math.min(appTourSteps.length - 1, prev + 1),
          )
        }
        onFinish={completeAppTour}
        onSkip={completeAppTour}
        nextLabel={t("appTour.next")}
        backLabel={t("appTour.back")}
        skipLabel={t("appTour.skip")}
        finishLabel={t("appTour.finish")}
        titleLabel={t("appTour.title")}
      />
      <MobileGuidedTour
        open={appTourOpen && !isDesktop}
        stepIndex={appTourStepIndex}
        steps={appTourSteps}
        onBack={() => setAppTourStepIndex((prev) => Math.max(0, prev - 1))}
        onNext={() =>
          setAppTourStepIndex((prev) =>
            Math.min(appTourSteps.length - 1, prev + 1),
          )
        }
        onFinish={completeAppTour}
        onSkip={completeAppTour}
        nextLabel={t("appTour.next")}
        backLabel={t("appTour.back")}
        skipLabel={t("appTour.skip")}
        finishLabel={t("appTour.finish")}
        titleLabel={t("appTour.title")}
      />
    </div>
  );
}
