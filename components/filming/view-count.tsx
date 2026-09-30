const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 256 → "256", 1234 → "1.2K", 3400000 → "3.4M" */
export function formatViews(views: number): string {
  return compact.format(views);
}

export function viewsLabel(views: number): string {
  return `${views.toLocaleString("en")} ${views === 1 ? "view" : "views"}`;
}

export function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
