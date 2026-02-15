import { useState } from "react";
import type { Location } from "react-router-dom";
import {
  LogIn,
  LogOut,
  Globe,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DsSidebarBrand,
  DsSidebarNavItem,
  DS_SIDEBAR_LANGUAGE_TRIGGER_CLASS,
  DS_SIDEBAR_ACCOUNT_TRIGGER_CLASS,
} from "@/components/ds";
import { Avatar } from "./Avatar";
import { LANGUAGE_OPTIONS, nav } from "./layoutConstants";

interface SidebarContentProps {
  location: Location;
  t: (key: string) => string;
  currentLng: string;
  handleLanguageChange: (locale: string) => void;
  isSignedIn: boolean;
  userProfile: { name: string; picture: string; email: string } | null;
  signIn: () => void;
  signOut: () => void;
  onNavClick?: () => void;
}

export function SidebarContent({
  location,
  t,
  currentLng,
  handleLanguageChange,
  isSignedIn,
  userProfile,
  signIn,
  signOut,
  onNavClick,
}: SidebarContentProps) {
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
