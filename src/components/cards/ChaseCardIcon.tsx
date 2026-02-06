import type { ChaseCardIconProps } from "@/types/cards";

export function ChaseCardIcon({ className = "", size = 32 }: ChaseCardIconProps) {
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
      <g transform="translate(5.8 11.4)">
        <path d="M8 0l2 2v4l-2 2H4L2 6V2l2-2h4z" fill="#117ACA" />
        <path d="M5.2 2h1.6v4H5.2z" fill="#fff" />
        <path d="M4 3.2h4v1.6H4z" fill="#fff" />
      </g>
      <text
        x="19.8"
        y="16.3"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#117ACA"
        fontSize="6.8"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        CHASE
      </text>
    </svg>
  );
}
