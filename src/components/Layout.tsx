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

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isSignedIn, userProfile, signIn, signOut } = useGoogleAuth();
  const currentLng = i18n.language;

  const handleLanguageChange = (locale: string) => {
    i18n.changeLanguage(locale);
    persistLocale(locale);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      <nav className="border-b md:border-b-0 md:border-r bg-muted/30 p-2 flex flex-row md:flex-col gap-1 shrink-0 overflow-hidden md:min-w-[180px]">
        <Link
          to="/"
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
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors shrink-0",
                location.pathname === to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t(labelKey)}
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
      </nav>
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 md:p-6">
        <div
          className={cn(
            "flex-1 min-h-0 flex flex-col",
            location.pathname === "/transactions"
              ? "overflow-hidden"
              : "overflow-auto",
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
