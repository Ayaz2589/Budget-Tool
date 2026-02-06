import type { WellsFargoCardIconProps } from "@/types/cards";

export function WellsFargoCardIcon({
  className = "",
  size = 32,
}: WellsFargoCardIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <rect x="2" y="7" width="28" height="18" rx="3" ry="3" fill="#C41230" />
      <text
        x="16"
        y="16.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#F7B600"
        fontSize="6.2"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        WELLS FARGO
      </text>
    </svg>
  );
}
