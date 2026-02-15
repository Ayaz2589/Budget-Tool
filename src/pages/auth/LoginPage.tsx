import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Landmark, BarChart3, Wallet, CreditCard } from "lucide-react";
import { useGoogleAuth } from "@/context";
import { RETURNING_USER_KEY } from "@/context";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useGoogleAuth();

  useEffect(() => {
    storage.setItem(RETURNING_USER_KEY, "1");
  }, []);

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col md:flex-row bg-background md:min-h-screen md:h-auto md:overflow-auto">
      {/* Left column: auth form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 md:px-12 lg:px-16 md:max-w-[480px] md:mx-0 mx-auto w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="size-6 text-primary" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-foreground">
            {t("layout.appName")}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
          {t("auth.createAccountHeading")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-8">
          {t("auth.createAccountSubheading")}
        </p>

        <div className="space-y-4">
          <Button
            onClick={signIn}
            size="lg"
            variant="outline"
            className="w-full h-12 text-base font-medium gap-3 border-2 hover:bg-muted/50"
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("auth.signInWithGoogle")}
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {t("auth.signInDisclaimer")}
        </p>
      </div>

      {/* Right column: illustration + value prop (hidden on small screens, visible md+) */}
      <div
        className={cn(
          "hidden md:flex flex-1 flex-col items-center justify-center px-8 lg:px-16 py-12",
          "bg-muted/30 border-l border-border",
        )}
      >
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-4 p-6 rounded-2xl bg-primary/5 border border-border/50">
              <BarChart3 className="size-16 text-primary/80" />
              <Wallet className="size-14 text-primary/60" />
              <CreditCard className="size-16 text-primary/80" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-foreground">
                {t("auth.valuePropTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("auth.valuePropSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
