/** The shared "live" detail: a pulsing green dot plus the localized label. Used by every bento card that shows live data. */
export function LiveTag({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`bx-livetag ${className}`.trim()}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}
