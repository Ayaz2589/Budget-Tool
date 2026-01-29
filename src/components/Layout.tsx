import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
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
  MoreHorizontal,
} from "lucide-react";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
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
import { persistLocale } from "@/i18n";
import i18n from "@/i18n";

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
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/transactions", labelKey: "nav.transactions", icon: List },
  { to: "/income", labelKey: "nav.income", icon: Wallet },
  { to: "/debt", labelKey: "nav.debt", icon: CreditCard },
  { to: "/mortgage", labelKey: "nav.mortgage", icon: Home },
  { to: "/import", labelKey: "nav.import", icon: Upload },
  { to: "/rules", labelKey: "nav.categoryRules", icon: ListOrdered },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

/** Primary tabs shown in mobile bottom nav */
const bottomNavItems = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/transactions", labelKey: "nav.transactions", icon: List },
  { to: "/income", labelKey: "nav.income", icon: Wallet },
];

/** Links shown in the "More" bottom sheet (rest of nav) */
const moreNavItems = [
  { to: "/debt", labelKey: "nav.debt", icon: CreditCard },
  { to: "/mortgage", labelKey: "nav.mortgage", icon: Home },
  { to: "/import", labelKey: "nav.import", icon: Upload },
  { to: "/rules", labelKey: "nav.categoryRules", icon: ListOrdered },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

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
  return (
    <>
      <Link
        to="/"
        onClick={onNavClick}
        className="flex items-center gap-2 px-3 py-2.5 shrink-0 border-b border-border/50 mb-1 md:mb-2"
      >
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Landmark className="size-5 text-primary" />
        </div>
        <span className="font-semibold text-base tracking-tight">
          {t("layout.appName")}
        </span>
      </Link>
      <div className="flex flex-1 md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
        {nav.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors min-w-0",
              location.pathname === to
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
      <div className="shrink-0 border-t md:border-t pt-2 mt-2 flex flex-col gap-1">
        <Select value={currentLng} onValueChange={handleLanguageChange}>
          <SelectTrigger className="h-8 gap-1.5 px-2 text-xs font-medium text-muted-foreground border-0 bg-transparent shadow-none hover:bg-muted focus:ring-2 w-full justify-start">
            <Globe className="size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[280px]!">
            <SelectItem value="en">{t("common.english")}</SelectItem>
            <SelectItem value="es">{t("common.spanish")}</SelectItem>
            <SelectItem value="bn">{t("common.bangla")}</SelectItem>
            <SelectItem value="zh">{t("common.chinese")}</SelectItem>
            <SelectItem value="ko">{t("common.korean")}</SelectItem>
            <SelectItem value="hi">{t("common.hindi")}</SelectItem>
            <SelectItem value="ja">{t("common.japanese")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="shrink-0 border-t md:border-t pt-2 mt-2 md:mt-auto flex flex-col gap-1">
        {isSignedIn ? (
          <>
            <div className="flex items-center gap-2 px-2 min-w-0">
              {userProfile ? (
                <>
                  <Avatar userProfile={userProfile} />
                  <span
                    className="text-sm font-medium truncate"
                    title={userProfile.email}
                  >
                    {userProfile.name}
                  </span>
                </>
              ) : (
                <>
                  <div className="size-8 rounded-full shrink-0 bg-muted" />
                  <span className="text-sm text-muted-foreground truncate">
                    {t("layout.loading")}
                  </span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="size-4" />
              {t("layout.signOut")}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2"
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
  const { t } = useTranslation();
  const location = useLocation();
  const { isSignedIn, userProfile, signIn, signOut } = useGoogleAuth();
  const currentLng = i18n.language;
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLanguageChange = (locale: string) => {
    i18n.changeLanguage(locale);
    persistLocale(locale);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile header: logo + app name only */}
      <header className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border-b bg-muted/30 shrink-0">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="size-5 text-primary" />
          </div>
          <span className="font-semibold text-base tracking-tight truncate">
            {t("layout.appName")}
          </span>
        </Link>
      </header>

      {/* Desktop sidebar: fixed width so it doesn't change with language */}
      <nav className="hidden md:flex border-r bg-muted/30 p-2 flex-col gap-1 shrink-0 w-[200px] overflow-hidden">
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
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 md:p-6 pb-20 md:pb-6">
        <div
          className={cn(
            "flex-1 min-h-0 flex flex-col",
            location.pathname === "/transactions"
              ? "overflow-hidden"
              : "overflow-auto",
          )}
        >
          <div className="mx-auto w-full max-w-7xl flex-1 min-h-0 flex flex-col min-w-0">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 py-2 safe-area-pb"
        aria-label={t("layout.navigation")}
      >
        {bottomNavItems.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1 rounded-md text-xs font-medium transition-colors min-w-0 flex-1 max-w-[33%]",
              location.pathname === to
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
            "flex flex-col items-center gap-0.5 px-4 py-1 rounded-md text-xs font-medium transition-colors min-w-0 flex-1 max-w-[33%] text-muted-foreground hover:text-foreground",
            moreNavItems.some(({ to }) => location.pathname === to)
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
          <div className="overflow-y-auto overscroll-contain p-4 pb-8 flex flex-col gap-1">
            {moreNavItems.map(({ to, labelKey, icon: Icon }) => (
              <DialogClose asChild key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === to
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {t(labelKey)}
                </Link>
              </DialogClose>
            ))}
            <div className="border-t my-2 pt-3 flex flex-col gap-2">
              <div className="px-2 text-xs font-medium text-muted-foreground">
                {t("layout.language")}
              </div>
              <Select value={currentLng} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-9 w-full">
                  <Globe className="size-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]!">
                  <SelectItem value="en">{t("common.english")}</SelectItem>
                  <SelectItem value="es">{t("common.spanish")}</SelectItem>
                  <SelectItem value="bn">{t("common.bangla")}</SelectItem>
                  <SelectItem value="zh">{t("common.chinese")}</SelectItem>
                  <SelectItem value="ko">{t("common.korean")}</SelectItem>
                  <SelectItem value="hi">{t("common.hindi")}</SelectItem>
                  <SelectItem value="ja">{t("common.japanese")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-3">
              {isSignedIn ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 min-w-0 mb-1">
                    {userProfile ? (
                      <>
                        <Avatar userProfile={userProfile} />
                        <span className="text-sm font-medium truncate">
                          {userProfile.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t("layout.loading")}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground"
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
                  className="w-full justify-start gap-2"
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
    </div>
  );
}
