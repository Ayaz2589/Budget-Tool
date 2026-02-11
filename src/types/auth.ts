export type SyncStatus = "idle" | "syncing" | "success" | "error";
export type SyncHealth = "healthy" | "warning" | "error";

export interface GoogleUserProfile {
  name: string;
  picture: string;
  email: string;
}

export interface GoogleAuthContextValue {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  userProfile: GoogleUserProfile | null;
  spreadsheetId: string | null;
  setSpreadsheetId: (id: string | null) => void;
  syncToSheets: () => Promise<void>;
  pullFromSheet: () => Promise<void>;
  syncStatus: SyncStatus;
  syncErrorMessage: string | null;
  isAutoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  lastSyncAt: number | null;
  hasUnsyncedChanges: boolean;
  syncHealth: SyncHealth;
  sheetSetupState:
    | "idle"
    | "loading"
    | "needs-selection"
    | "needs-create"
    | "creating"
    | "done"
    | "error";
  availableDriveSheets: Array<{ id: string; name: string; modifiedTime?: string }>;
  runSheetAutoSetup: () => Promise<void>;
  linkDriveSheet: (id: string) => void;
  createOrthoDriveSheet: () => Promise<void>;
  dismissSheetSetupPrompt: () => void;
}
