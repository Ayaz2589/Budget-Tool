import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Landmark, CircleHelp, AlertTriangle, X } from "lucide-react";
import { useGoogleAuth, useBudget } from "@/context";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { persistLocale } from "@/i18n";
import i18n from "@/i18n";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";
import { SheetSetupDialog } from "@/components/SheetSetupDialog";
import { SidebarContent } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const SIDEBAR_EXPANDED_W = 220;
const SIDEBAR_COLLAPSED_W = 64;

function getHelpHintSeen(): boolean {
  return storage.getItem(STORAGE_KEYS.HELP_HINT_SEEN) === "1";
}

function setHelpHintSeen(): void {
  storage.setItem(STORAGE_KEYS.HELP_HINT_SEEN, "1");
}

export function Layout() {
  const MIN_SYNCING_VISIBLE_MS = 1200;
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { uiFormatSettings } = useBudget();
  const [fxWarningDismissed, setFxWarningDismissed] = useState(false);
  const showFxWarning =
    !fxWarningDismissed &&
    uiFormatSettings.currency !== "USD" &&
    uiFormatSettings.fxFallback === true &&
    uiFormatSettings.fxRate === 1;
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
  const isActivePath = (to: string) => {
    if (to === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };
  const [showSyncComplete, setShowSyncComplete] = useState(false);
  const [showHelpHintModal, setShowHelpHintModal] = useState(false);
  const prevSignedInRef = useRef(isSignedIn);
  const prevSheetSetupOpenRef = useRef(false);
  const helpHintSeenRef = useRef(getHelpHintSeen());
  const syncingStartedAtRef = useRef<number | null>(null);
  const delayedCompleteTimerRef = useRef<number | null>(null);
  const isSheetSetupDialogOpen =
    isSignedIn &&
    !spreadsheetId &&
    sheetSetupState !== "idle" &&
    sheetSetupState !== "done";
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
      prevSheetSetupOpenRef.current = false;
      setShowHelpHintModal(false);
      return;
    }

    if (
      prevSheetSetupOpenRef.current &&
      !isSheetSetupDialogOpen &&
      !helpHintSeenRef.current
    ) {
      const timer = window.setTimeout(() => {
        setShowHelpHintModal(true);
        helpHintSeenRef.current = true;
        setHelpHintSeen();
      }, 180);
      prevSheetSetupOpenRef.current = isSheetSetupDialogOpen;
      return () => window.clearTimeout(timer);
    }

    prevSheetSetupOpenRef.current = isSheetSetupDialogOpen;
  }, [isSignedIn, isSheetSetupDialogOpen]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    storage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "1",
  );
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      storage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, next ? "1" : "0");
      return next;
    });
  }, []);
  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  const handleLanguageChange = (locale: string) => {
    i18n.changeLanguage(locale);
    persistLocale(locale);
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

      {/* Desktop sidebar */}
      <TooltipProvider>
        <nav
          className={cn(
            "hidden md:flex fixed left-0 top-0 bottom-0 border-r border-[var(--border-subtle)] bg-[var(--surface-1)]/92 flex-col overflow-hidden backdrop-blur-sm shadow-[1px_0_10px_rgba(15,23,42,0.08)] dark:shadow-[1px_0_12px_rgba(0,0,0,0.24)] transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
            sidebarCollapsed ? "items-center px-2 py-3 gap-0.5" : "p-3 gap-1",
          )}
          style={{ width: sidebarW }}
        >
          <SidebarContent
            location={location}
            t={t}
            currentLng={currentLng}
            handleLanguageChange={handleLanguageChange}
            isSignedIn={isSignedIn}
            userProfile={userProfile}
            signIn={signIn}
            signOut={signOut}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={toggleSidebar}
          />
        </nav>
      </TooltipProvider>
      <main
        className={cn(
          "flex-1 flex flex-col pb-[calc(6.25rem+env(safe-area-inset-bottom))] md:pb-6 md:transition-[margin-left] md:duration-200 md:ease-[cubic-bezier(0.4,0,0.2,1)]",
          "p-0 md:p-6",
          sidebarCollapsed ? "md:ml-[64px]" : "md:ml-[220px]",
          location.pathname !== "/dashboard" && "flatten-mobile-cards",
        )}
      >
        <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col min-w-0">
          {showFxWarning && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 mx-4 mt-3 md:mx-0 md:mt-0 md:mb-4 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="flex-1">{t("layout.fxUnavailable")}</span>
              <button
                type="button"
                onClick={() => setFxWarningDismissed(true)}
                className="shrink-0 rounded p-0.5 hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav
        isActivePath={isActivePath}
        currentLng={currentLng}
        handleLanguageChange={handleLanguageChange}
        isSignedIn={isSignedIn}
        userProfile={userProfile}
        signIn={signIn}
        signOut={signOut}
      />

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
      <Dialog open={showHelpHintModal} onOpenChange={setShowHelpHintModal}>
        <DialogContent
          className="max-w-[calc(100%-1rem)] gap-3 p-4 sm:max-w-md sm:gap-4 sm:p-5"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>{t("layout.helpHintTitle")}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {t("layout.helpHintBodyStart")}{" "}
              <CircleHelp className="mx-1 inline size-4 align-[-2px]" />{" "}
              {t("layout.helpHintBodyEnd")}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-1">
            <Button
              className="w-full"
              onClick={() => setShowHelpHintModal(false)}
            >
              {t("layout.helpHintCta")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
