import type { VisaCardIconProps } from "@/types/cards";

export function VisaCardIcon({ className = "", size = 32 }: VisaCardIconProps) {
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
      <text
        x="16"
        y="16.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1A1F71"
        fontSize="9"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}
