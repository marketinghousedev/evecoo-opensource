export function Icon({ name, size, fill, className = '' }: { name: string; size?: number; fill?: boolean; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      aria-hidden="true"
      style={{ ...(size ? { fontSize: size } : {}), ...(fill ? { fontVariationSettings: "'FILL' 1" } : {}) }}
    >
      {name}
    </span>
  );
}
