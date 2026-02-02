export type SyncStatus = "idle" | "syncing" | "success" | "error";

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
}
