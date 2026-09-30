export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid place-items-center rounded-full bg-ink/35 text-paper ring-1 ring-paper/60 backdrop-blur-sm ${className}`}
    >
      <svg viewBox="0 0 24 24" className="ml-[8%] size-[42%]" fill="currentColor">
        <path d="M7 4.5v15a.75.75 0 0 0 1.14.64l12.2-7.5a.75.75 0 0 0 0-1.28L8.14 3.86A.75.75 0 0 0 7 4.5Z" />
      </svg>
    </span>
  );
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Instagram-style "multiple photos" mark for album tiles. */
export function AlbumIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <rect x="3" y="7" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 4h11a2 2 0 0 1 2 2v11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
