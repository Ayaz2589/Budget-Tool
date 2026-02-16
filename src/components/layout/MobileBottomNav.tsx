import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LogIn,
  LogOut,
  Globe,
  MoreHorizontal,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "./Avatar";
import { bottomNavItems, moreNavItems, LANGUAGE_OPTIONS } from "./layoutConstants";

interface MobileBottomNavProps {
  isActivePath: (to: string) => boolean;
  currentLng: string;
  handleLanguageChange: (locale: string) => void;
  isSignedIn: boolean;
  userProfile: { name: string; picture: string; email: string } | null;
  signIn: () => void;
  signOut: () => void;
  onFeedbackOpen: () => void;
}

export function MobileBottomNav({
  isActivePath,
  currentLng,
  handleLanguageChange,
  isSignedIn,
  userProfile,
  signIn,
  signOut,
  onFeedbackOpen,
}: MobileBottomNavProps) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
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
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onFeedbackOpen();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-control)] text-sm font-medium border border-transparent transition-colors text-[var(--text-primary)] hover:bg-[var(--control-hover)] hover:border-[var(--border-subtle)]"
            >
              <MessageSquarePlus className="size-5 shrink-0" />
              {t("feedback.buttonLabel")}
            </button>
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
    </>
  );
}
