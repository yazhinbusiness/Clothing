"use client";

const VARIANTS = {
  primary:
    "bg-[var(--color-gold)] text-[var(--color-gold-contrast)] hover:bg-[var(--color-gold-bright)] shadow-[var(--shadow-pop)]",
  secondary:
    "bg-transparent text-[var(--color-text)] border border-[var(--color-border-strong)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-bright)]",
  ghost:
    "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)]",
};

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        "om-tap inline-flex items-center justify-center gap-2 rounded-full font-medium",
        "text-[15px] px-6 py-3.5 select-none",
        "disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100",
        fullWidth ? "w-full" : "",
        VARIANTS[variant] ?? VARIANTS.primary,
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
