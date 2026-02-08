import { Landmark } from "lucide-react";
import { Link } from "react-router-dom";

interface DsSidebarBrandProps {
  title: string;
  to: string;
  onClick?: () => void;
}

export function DsSidebarBrand({ title, to, onClick }: DsSidebarBrandProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 px-3 py-3 shrink-0 mb-2"
    >
      <div className="size-11 rounded-xl bg-[var(--control-surface)] border border-[var(--control-border)] flex items-center justify-center shrink-0">
        <Landmark className="size-5 text-[var(--text-primary)]" />
      </div>
      <span className="font-semibold text-2xl leading-none tracking-tight">
        {title}
      </span>
    </Link>
  );
}

