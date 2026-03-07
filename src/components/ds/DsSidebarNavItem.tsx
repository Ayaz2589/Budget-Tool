import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DsSidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export function DsSidebarNavItem({
  to,
  label,
  icon: Icon,
  active = false,
  collapsed = false,
  onClick,
}: DsSidebarNavItemProps) {
  const link = (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative flex items-center rounded-[var(--radius-control)] font-medium transition-all duration-150 min-w-0",
        collapsed ? "justify-center size-10" : "gap-3 px-3 py-2.5",
        active
          ? "bg-[var(--interactive-primary)]/10 text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)]",
      )}
    >
      {/* Animated left accent bar */}
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--interactive-primary)]"
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        />
      )}

      {/* Icon — brand-colored when active */}
      <Icon
        className={cn(
          "shrink-0 transition-colors duration-150",
          collapsed ? "size-5" : "size-4",
          active ? "text-[var(--interactive-primary)]" : "",
        )}
      />

      {/* Label — semibold when active */}
      {!collapsed && (
        <span className={cn("truncate text-sm leading-none", active && "font-semibold text-[var(--interactive-primary)]")}>
          {label}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
