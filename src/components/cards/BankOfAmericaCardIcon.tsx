import type { BankOfAmericaCardIconProps } from "@/types/cards";

export function BankOfAmericaCardIcon({
  className = "",
  size = 32,
}: BankOfAmericaCardIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <rect x="2" y="7" width="28" height="18" rx="3" ry="3" fill="#FFFFFF" />
      <path d="M7 19h18v1.6H7z" fill="#D4001A" />
      <path d="M9 16.2h14v1.4H9z" fill="#0A3A8A" />
      <path d="M11 13.8h10v1.2H11z" fill="#D4001A" />
      <path d="M13 12h6v1.1h-6z" fill="#0A3A8A" />
    </svg>
  );
}
