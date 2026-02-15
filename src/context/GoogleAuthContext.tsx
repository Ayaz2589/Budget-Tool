import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGoogleLogin } from "@react-oauth/google";
import i18n from "@/i18n";
import { extractSpreadsheetId } from "@/lib/googleSheets";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type { SyncStatus, SyncHealth } from "@/types/auth";
import type { GoogleUserProfile, GoogleAuthContextValue } from "@/types/auth";

import { SheetSetupProvider, useSheetSetup } from "./SheetSetupContext";
import { SyncProvider, useSync } from "./SyncContext";

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

/** Re-export from STORAGE_KEYS for consumers that need the key values directly. */
export const RETURNING_USER_KEY = STORAGE_KEYS.RETURNING_USER;
/** Re-export from STORAGE_KEYS for consumers that need the key values directly. */
export const TOUR_COMPLETED_KEY = STORAGE_KEYS.TOUR_COMPLETED;

/** Exported for tests that need to inject auth state (e.g. AuthGate, LoginPage). */
export type { GoogleUserProfile, GoogleAuthContextValue };

// ---------------------------------------------------------------------------
// Token storage helpers
// ---------------------------------------------------------------------------

function getStoredAccessToken(): string | null {
  try {
    const raw = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      access_token: string;
      expires_at?: number;
    };
    if (parsed.expires_at != null && Date.now() >= parsed.expires_at) {
      storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      return null;
    }
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

function getStoredExpiresAt(): number | null {
  try {
    const raw = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expires_at?: number };
    return parsed.expires_at ?? null;
  } catch {
    return null;
  }
}

function setStoredAccessToken(
  accessToken: string,
  expiresInSeconds?: number,
): void {
  const payload: { access_token: string; expires_at?: number } = {
    access_token: accessToken,
  };
  if (expiresInSeconds != null && expiresInSeconds > 0) {
    payload.expires_at = Date.now() + expiresInSeconds * 1000;
  }
  storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, JSON.stringify(payload));
}

function clearStoredAccessToken(): void {
  storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
}

const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** Exported for tests that need to inject isSignedIn (e.g. AuthGate, LoginPage). */
export const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(
  null,
);

// ---------------------------------------------------------------------------
// Fallback provider (no Google client ID)
// ---------------------------------------------------------------------------

/**
 * Use when VITE_GOOGLE_CLIENT_ID is not set. Provides the same context interface
 * but never initializes the Google GSI client (avoids "Missing required parameter client_id").
 */
export function GoogleAuthProviderFallback({
  children,
}: {
  children: ReactNode;
}) {
  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(
    () => storage.getItem(STORAGE_KEYS.SPREADSHEET_ID),
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(
    null,
  );
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [lastSyncAt] = useState<number | null>(null);
  const [hasUnsyncedChanges] = useState(false);
  const [syncHealth] = useState<SyncHealth>("healthy");
  const [sheetSetupState] =
    useState<GoogleAuthContextValue["sheetSetupState"]>("idle");
  const [availableDriveSheets] = useState<
    GoogleAuthContextValue["availableDriveSheets"]
  >([]);

  useEffect(() => {
    if (spreadsheetId) {
      storage.setItem(STORAGE_KEYS.SPREADSHEET_ID, spreadsheetId);
    } else {
      storage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
    }
  }, [spreadsheetId]);

  const setSpreadsheetId = useCallback((id: string | null) => {
    if (id) {
      const extracted = id.includes("/") ? extractSpreadsheetId(id) : id;
      setSpreadsheetIdState(extracted || id);
    } else {
      setSpreadsheetIdState(null);
    }
  }, []);

  const value = useMemo<GoogleAuthContextValue>(
    () => ({
      isSignedIn: false,
      userProfile: null,
      signIn: () => {},
      signOut: () => {},
      spreadsheetId,
      setSpreadsheetId,
      syncToSheets: async () => {
        setSyncStatus("error");
        setSyncErrorMessage(i18n.t("auth.googleNotConfigured"));
      },
      pullFromSheet: async () => {
        setSyncStatus("error");
        setSyncErrorMessage(i18n.t("auth.googleNotConfigured"));
      },
      syncStatus,
      syncErrorMessage,
      isAutoSyncEnabled,
      setAutoSyncEnabled: setIsAutoSyncEnabled,
      lastSyncAt,
      hasUnsyncedChanges,
      syncHealth,
      sheetSetupState,
      availableDriveSheets,
      runSheetAutoSetup: async () => {},
      linkDriveSheet: () => {},
      createOrthoDriveSheet: async () => {},
      dismissSheetSetupPrompt: () => {},
    }),
    [
      spreadsheetId,
      setSpreadsheetId,
      syncStatus,
      syncErrorMessage,
      isAutoSyncEnabled,
      lastSyncAt,
      hasUnsyncedChanges,
      syncHealth,
      sheetSetupState,
      availableDriveSheets,
    ],
  );

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Composer: reads from SheetSetup + Sync sub-contexts and provides unified value
// ---------------------------------------------------------------------------

function GoogleAuthComposer({
  children,
  accessToken,
  userProfile,
  signIn,
  signOut,
}: {
  children: ReactNode;
  accessToken: string | null;
  userProfile: GoogleUserProfile | null;
  signIn: () => void;
  signOut: () => void;
}) {
  const sheetSetup = useSheetSetup();
  const sync = useSync();

  const value = useMemo<GoogleAuthContextValue>(
    () => ({
      isSignedIn: !!accessToken,
      userProfile,
      signIn,
      signOut,
      spreadsheetId: sheetSetup.spreadsheetId,
      setSpreadsheetId: sheetSetup.setSpreadsheetId,
      syncToSheets: sync.syncToSheets,
      pullFromSheet: sync.pullFromSheet,
      syncStatus: sync.syncStatus,
      syncErrorMessage: sync.syncErrorMessage,
      isAutoSyncEnabled: sync.isAutoSyncEnabled,
      setAutoSyncEnabled: sync.setAutoSyncEnabled,
      lastSyncAt: sync.lastSyncAt,
      hasUnsyncedChanges: sync.hasUnsyncedChanges,
      syncHealth: sync.syncHealth,
      sheetSetupState: sheetSetup.sheetSetupState,
      availableDriveSheets: sheetSetup.availableDriveSheets,
      runSheetAutoSetup: sheetSetup.runSheetAutoSetup,
      linkDriveSheet: sheetSetup.linkDriveSheet,
      createOrthoDriveSheet: sheetSetup.createOrthoDriveSheet,
      dismissSheetSetupPrompt: sheetSetup.dismissSheetSetupPrompt,
    }),
    [
      accessToken,
      userProfile,
      signIn,
      signOut,
      sheetSetup.spreadsheetId,
      sheetSetup.setSpreadsheetId,
      sheetSetup.sheetSetupState,
      sheetSetup.availableDriveSheets,
      sheetSetup.runSheetAutoSetup,
      sheetSetup.linkDriveSheet,
      sheetSetup.createOrthoDriveSheet,
      sheetSetup.dismissSheetSetupPrompt,
      sync.syncToSheets,
      sync.pullFromSheet,
      sync.syncStatus,
      sync.syncErrorMessage,
      sync.isAutoSyncEnabled,
      sync.setAutoSyncEnabled,
      sync.lastSyncAt,
      sync.hasUnsyncedChanges,
      sync.syncHealth,
    ],
  );

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// GoogleAuthProvider — manages OAuth and composes sub-providers
// ---------------------------------------------------------------------------

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    getStoredAccessToken,
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(
    getStoredExpiresAt,
  );
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(
    null,
  );

  const clearSession = useCallback(() => {
    clearStoredAccessToken();
    setAccessToken(null);
    setExpiresAt(null);
    setUserProfile(null);
    storage.setItem(STORAGE_KEYS.RETURNING_USER, "1");
  }, []);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const expiresIn = tokenResponse.expires_in ?? 3600;
      setStoredAccessToken(tokenResponse.access_token, expiresIn);
      setAccessToken(tokenResponse.access_token);
      setExpiresAt(Date.now() + expiresIn * 1000);
    },
    onError: () => {
      clearSession();
    },
    scope:
      "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    flow: "implicit",
  });

  // Fetch user profile when access token changes
  useEffect(() => {
    if (!accessToken) {
      setUserProfile(null);
      return;
    }
    let cancelled = false;
    fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to fetch profile")),
      )
      .then((data: { name?: string; picture?: string; email?: string }) => {
        if (
          !cancelled &&
          data.name != null &&
          data.picture != null &&
          data.email != null
        ) {
          setUserProfile({
            name: data.name,
            picture: data.picture,
            email: data.email,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setUserProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const signIn = useCallback(() => {
    login();
  }, [login]);

  const signOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Token expiry check
  useEffect(() => {
    if (expiresAt == null) return;
    const interval = setInterval(() => {
      if (Date.now() >= expiresAt) {
        clearSession();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt, clearSession]);

  return (
    <SheetSetupProvider accessToken={accessToken}>
      <SheetSetupSyncBridge
        accessToken={accessToken}
        clearSession={clearSession}
        userProfile={userProfile}
        signIn={signIn}
        signOut={signOut}
      >
        {children}
      </SheetSetupSyncBridge>
    </SheetSetupProvider>
  );
}

/**
 * Bridge component that reads from SheetSetupContext and passes props
 * down to SyncProvider and GoogleAuthComposer.  Necessary because
 * SyncProvider needs the spreadsheetId / setSpreadsheetId from SheetSetup.
 */
function SheetSetupSyncBridge({
  children,
  accessToken,
  clearSession,
  userProfile,
  signIn,
  signOut,
}: {
  children: ReactNode;
  accessToken: string | null;
  clearSession: () => void;
  userProfile: GoogleUserProfile | null;
  signIn: () => void;
  signOut: () => void;
}) {
  const sheetSetup = useSheetSetup();

  return (
    <SyncProvider
      accessToken={accessToken}
      spreadsheetId={sheetSetup.spreadsheetId}
      setSpreadsheetId={sheetSetup.setSpreadsheetId}
      clearSession={clearSession}
      consumeInitialSyncFlag={sheetSetup.consumeInitialSyncFlag}
    >
      <GoogleAuthComposer
        accessToken={accessToken}
        userProfile={userProfile}
        signIn={signIn}
        signOut={signOut}
      >
        {children}
      </GoogleAuthComposer>
    </SyncProvider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx)
    throw new Error("useGoogleAuth must be used within GoogleAuthProvider");
  return ctx;
}
