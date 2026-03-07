import { Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DsSidebarBrandProps {
  title: string;
  to: string;
  collapsed?: boolean;
  onClick?: () => void;
}

export function DsSidebarBrand({ title, to, collapsed = false, onClick }: DsSidebarBrandProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center shrink-0",
        collapsed ? "justify-center py-3 px-0" : "gap-3 px-3 py-3 mb-1",
      )}
    >
      <div className={cn(
        "rounded-xl bg-[var(--control-surface)] border border-[var(--control-border)] flex items-center justify-center shrink-0",
        collapsed ? "size-9" : "size-10",
      )}>
        <Landmark className={cn(collapsed ? "size-4" : "size-5", "text-[var(--text-primary)]")} />
      </div>
      {!collapsed && (
        <span className="font-semibold text-xl leading-none tracking-tight">
          {title}
        </span>
      )}
    </Link>
  );
}
