/** Wireframe cube — monogram, loader mark and favicon are all this shape. */
export const Monogram = ({ size = 26, className }: { size?: number; className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    focusable="false"
    style={{ display: 'block', flex: 'none' }}
  >
    <path
      d="M6 10 L16 4 L26 10 L26 22 L16 28 L6 22 Z M6 10 L16 16 L26 10 M16 16 L16 28"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
)
