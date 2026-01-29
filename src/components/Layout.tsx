import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  List,
  Wallet,
  ListOrdered,
  Settings,
  LogIn,
  LogOut,
} from "lucide-react";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { Button } from "@/components/ui/button";

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
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/import", label: "Import CSV", icon: Upload },
  { to: "/transactions", label: "Transactions", icon: List },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/rules", label: "Category Rules", icon: ListOrdered },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const { isSignedIn, userProfile, signIn, signOut } = useGoogleAuth();

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      <nav className="border-b md:border-b-0 md:border-r bg-muted/30 p-2 flex flex-row md:flex-col gap-1 shrink-0 overflow-hidden md:min-w-[180px]">
        <div className="flex flex-1 md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
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
              {label}
            </Link>
          ))}
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
                      Loading…
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
                Sign out
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
              Sign in with Google
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
