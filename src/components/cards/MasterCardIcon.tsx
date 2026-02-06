import type { MasterCardIconProps } from "@/types/cards";

export function MasterCardIcon({
  className = "",
  size = 32,
}: MasterCardIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <rect x="2" y="7" width="28" height="18" rx="3" ry="3" fill="#111111" />
      <circle cx="13.5" cy="16" r="4.5" fill="#EB001B" />
      <circle cx="18.5" cy="16" r="4.5" fill="#F79E1B" />
    </svg>
  );
}
