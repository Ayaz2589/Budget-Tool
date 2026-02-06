import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";

type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncStatusIndicatorProps {
  hasUnsyncedChanges: boolean;
  syncStatus: SyncStatus;
  showSyncComplete: boolean;
  className?: string;
}

export function SyncStatusIndicator({
  hasUnsyncedChanges,
  syncStatus,
  showSyncComplete,
  className,
}: SyncStatusIndicatorProps) {
  const shouldShow =
    hasUnsyncedChanges || syncStatus === "syncing" || showSyncComplete;
  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        "fixed z-50 rounded-full border px-3 py-2 text-xs font-medium shadow-lg flex items-center gap-2 left-4 md:left-[240px] bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-4",
        syncStatus === "syncing"
          ? "bg-sky-600 text-white border-sky-500"
          : hasUnsyncedChanges
            ? "bg-amber-400 text-black border-amber-300"
            : "bg-emerald-600 text-white border-emerald-500",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {syncStatus === "syncing" ? (
        <>
          <Loader2 className="size-3.5 animate-spin" data-testid="sync-icon-syncing" />
          <span>Syncing</span>
        </>
      ) : hasUnsyncedChanges ? (
        <>
          <Clock3 className="size-3.5" data-testid="sync-icon-pending" />
          <span>Sync pending</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="size-3.5" data-testid="sync-icon-complete" />
          <span>Sync complete</span>
        </>
      )}
    </div>
  );
}
