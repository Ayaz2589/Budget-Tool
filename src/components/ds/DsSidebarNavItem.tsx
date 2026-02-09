import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DsSidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
}

export function DsSidebarNavItem({
  to,
  label,
  icon: Icon,
  active = false,
  onClick,
}: DsSidebarNavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] text-sm leading-none font-medium transition-colors min-w-0 border border-transparent",
        active
          ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)] border-[var(--interactive-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
