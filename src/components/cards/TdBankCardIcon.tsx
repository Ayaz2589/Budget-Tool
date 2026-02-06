import type { TdBankCardIconProps } from "@/types/cards";

export function TdBankCardIcon({ className = "", size = 32 }: TdBankCardIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <g>
        <rect x="2" y="7" width="28" height="18" rx="3" ry="3" fill="#11843F" />
        <rect x="4.5" y="9.5" width="23" height="13" rx="1.5" ry="1.5" fill="#0E6F35" />
        <text
          x="16"
          y="16.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFFFFF"
          fontSize="8.5"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
        >
          TD
        </text>
      </g>
    </svg>
  );
}
