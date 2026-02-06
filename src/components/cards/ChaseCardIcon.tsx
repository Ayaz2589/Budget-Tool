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
      <rect x="4.5" y="9.5" width="23" height="13" rx="1.5" ry="1.5" fill="#F6FAFF" />
      <svg
        x="9"
        y="9"
        width="14"
        height="14"
        viewBox="-458.9 441 200 200"
        aria-hidden
      >
      <g>
        <g>
          <path
            fill="#126BC5"
            d="M-387.5,441c-4.2,0-6.7,3.4-6.7,6.7v49.6h131.1l-59.7-56.3C-322.8,441-387.5,441-387.5,441z"
          />
          <path
            fill="#126BC5"
            d="M-258.9,512.4c0-4.2-3.4-6.7-6.7-6.7h-49.6v131.1l56.3-59.7C-258.9,577.1-258.9,512.4-258.9,512.4z"
          />
          <path
            fill="#126BC5"
            d="M-330.3,641c4.2,0,6.7-3.4,6.7-6.7v-49.6h-131.1L-395,641C-395,641-330.3,641-330.3,641z"
          />
          <path
            fill="#126BC5"
            d="M-458.9,569.6c0,4.2,3.4,6.7,6.7,6.7h49.6V446l-56.3,59.7L-458.9,569.6z"
          />
        </g>
      </g>
      </svg>
    </svg>
  );
}
