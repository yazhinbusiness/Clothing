"use client";

export default function IconButton({
  children,
  badge,
  active = false,
  size = 40,
  className = "",
  ...rest
}) {
  return (
    <button
      type="button"
      className={[
        "om-tap relative inline-flex items-center justify-center rounded-full",
        "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]",
        "hover:border-[var(--color-gold)] hover:text-[var(--color-gold-bright)]",
        active ? "border-[var(--color-gold)] text-[var(--color-gold-bright)]" : "",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
      {badge ? (
        <span className="animate-pop-in absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-gold)] text-[var(--color-gold-contrast)] text-[10px] font-semibold flex items-center justify-center">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
