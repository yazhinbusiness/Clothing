"use client";

export default function Chip({
  children,
  active = false,
  disabled = false,
  // Temporarily ignore taps (e.g. while saving) WITHOUT the greyed-out,
  // struck-through look that `disabled` means ("not valid right now").
  busy = false,
  // Looks the same as `disabled` visually, but stays clickable — use
  // for "not available until you tap Customize" rather than "this
  // specific combination is invalid". `onLockedClick` fires instead
  // of `onClick` when true, typically to show a hint.
  locked = false,
  onClick,
  onLockedClick,
  className = "",
  title,
}) {
  const looksDisabled = disabled || locked;

  return (
    <button
      type="button"
      title={title}
      onClick={locked ? onLockedClick : onClick}
      disabled={disabled || busy}
      className={[
        "om-tap relative min-w-[44px] px-4 h-10 rounded-full text-sm font-medium",
        "border transition-colors",
        looksDisabled
          ? "border-[var(--color-border)] text-[var(--color-text-faint)] line-through opacity-50"
          : active
          ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-gold-contrast)]"
          : "border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-bright)]",
        disabled ? "cursor-not-allowed" : locked ? "cursor-pointer" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
