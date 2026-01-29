import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  List,
  Wallet,
  ListOrdered,
  Settings,
} from "lucide-react";

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
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      <nav className="border-b md:border-b-0 md:border-r bg-muted/30 p-2 flex flex-row md:flex-col gap-1 shrink-0 overflow-hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location.pathname === to
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
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
