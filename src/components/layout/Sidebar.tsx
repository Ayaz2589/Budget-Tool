import { useState } from "react";
import type { Location } from "react-router-dom";
import {
  LogIn,
  LogOut,
  Globe,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DsSidebarBrand,
  DsSidebarNavItem,
  DS_SIDEBAR_LANGUAGE_TRIGGER_CLASS,
} from "@/components/ds";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { LANGUAGE_OPTIONS, navGroups } from "./layoutConstants";

interface SidebarContentProps {
  location: Location;
  t: (key: string) => string;
  currentLng: string;
  handleLanguageChange: (locale: string) => void;
  isSignedIn: boolean;
  userProfile: { name: string; picture: string; email: string } | null;
  signIn: () => void;
  signOut: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
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
  collapsed,
  onToggleCollapsed,
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
        collapsed={collapsed}
        onClick={onNavClick}
      />
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto pt-1">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && (
              <div className={cn("my-1.5", collapsed ? "mx-2" : "mx-3")}>
                <div className="h-px bg-[var(--border-subtle)]" />
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ to, labelKey, icon: Icon }) => (
                <DsSidebarNavItem
                  key={to}
                  to={to}
                  label={t(labelKey)}
                  icon={Icon}
                  onClick={onNavClick}
                  active={isActivePath(to)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer controls */}
      <div className="shrink-0 mt-auto pt-3 flex flex-col gap-2">
        {/* Language */}
        {collapsed ? (
          <div className="flex justify-center">
            <Select value={currentLng} onValueChange={handleLanguageChange}>
              <SelectTrigger className="size-10 justify-center rounded-[var(--radius-control)] border-0 bg-transparent px-0 text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)] [&>svg:last-child]:hidden">
                <Globe className="size-4" />
              </SelectTrigger>
              <SelectContent side="right" align="end" className="max-h-[280px]!">
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
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
        )}

        {/* Account */}
        {collapsed ? (
          isSignedIn ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex justify-center items-center size-10 mx-auto rounded-[var(--radius-control)] hover:bg-[var(--control-hover)] transition-colors"
                      aria-label={userProfile?.email ?? t("layout.loading")}
                    >
                      {userProfile ? (
                        <Avatar userProfile={userProfile} />
                      ) : (
                        <div className="size-7 rounded-full bg-muted" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="end" className="w-44 p-1">
                    {userProfile && (
                      <div className="px-2.5 py-2 text-xs text-muted-foreground truncate border-b mb-1">
                        {userProfile.email}
                      </div>
                    )}
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
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {userProfile?.name ?? t("layout.loading")}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex justify-center items-center size-10 mx-auto rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={signIn}
                >
                  <LogIn className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("layout.signIn")}
              </TooltipContent>
            </Tooltip>
          )
        ) : (
          isSignedIn ? (
            <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-2.5 text-left hover:bg-[var(--control-hover)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]/45"
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
          )
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            "flex items-center rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)] transition-colors",
            collapsed ? "justify-center size-10 mx-auto" : "gap-3 px-3 py-2 w-full",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" />
              <span className="text-xs">{t("layout.collapse")}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
