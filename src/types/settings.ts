export interface ExpenseCategoriesCardProps {
  categories: string[];
  onRemove: (category: string) => void;
  onAdd: (name: string) => void;
}

export interface IncomeCategoriesCardProps {
  categories: string[];
  onRemove: (category: string) => void;
  onAdd: (name: string) => void;
}

export interface OwnersCardProps {
  owners: string[];
  onRemove: (owner: string) => void;
  onAdd: (name: string) => void;
}

export interface GoogleSheetsCardProps {
  useDummyData: boolean;
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  spreadsheetId: string | undefined;
  sheetIdInput: string;
  onSheetIdChange: (value: string) => void;
  onSetSheetId: () => void;
  syncToSheets: () => void;
  pullFromSheet: () => void;
  syncStatus: "idle" | "syncing" | "success" | "error";
  syncErrorMessage: string | undefined;
  isAutoSyncEnabled: boolean;
  onAutoSyncToggle: (enabled: boolean) => void;
  lastSyncAt: number | null;
  hasUnsyncedChanges: boolean;
  syncHealth: "healthy" | "warning" | "error";
  onRepairDates: () => void;
  repairResult: string | null;
  syncConfirmOpen: boolean;
  setSyncConfirmOpen: (open: boolean) => void;
  restoreConfirmOpen: boolean;
  setRestoreConfirmOpen: (open: boolean) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}
