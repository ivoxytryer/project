export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <rect x="2.75" y="2.75" width="18.5" height="18.5" />
      <path d="M6.75 12.5l3.25 3.25 7.25-8" strokeLinecap="square" />
    </svg>
  );
}
