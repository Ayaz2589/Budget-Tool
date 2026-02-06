import type { SapphireCardIconProps } from "@/types/cards";

export function SapphireCardIcon({
  className = "",
  size = 32,
}: SapphireCardIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sapphire-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A3D91" />
          <stop offset="100%" stopColor="#35A8FF" />
        </linearGradient>
      </defs>
      <rect x="2" y="7" width="28" height="18" rx="3" ry="3" fill="url(#sapphire-grad)" />
      <text
        x="16"
        y="16.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#FFFFFF"
        fontSize="6.5"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        SAPPHIRE
      </text>
    </svg>
  );
}
