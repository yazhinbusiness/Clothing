"use client";

import { FabricIcon } from "@/components/ui/icons";

/**
 * One option-value tile, Proper Cloth style: a square preview area
 * on top, label underneath, selected/disabled states.
 *
 * `icon` renders a placeholder illustration for now — once real
 * per-option photography exists, swap this for an <img src={...}/>
 * sourced from wherever that asset ends up living (no other change
 * needed here, the card layout stays the same).
 */
export default function OptionSwatchCard({
  label,
  icon: Icon = FabricIcon,
  active = false,
  disabled = false,
  // Ignore taps while saving without looking disabled.
  busy = false,
  // Same look as disabled, but stays clickable — "not available until
  // you tap Customize" rather than "invalid with current selection".
  locked = false,
  onClick,
  onLockedClick,
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
        "om-tap flex flex-col items-center gap-1.5 rounded-2xl p-2 w-full min-w-0 border transition-colors",
        looksDisabled
          ? `border-[var(--color-border)] opacity-40 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`
          : active
          ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
          : "border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/60",
      ].join(" ")}
    >
      <span
        className={[
          "flex items-center justify-center h-12 w-12 rounded-xl",
          active
            ? "bg-[var(--color-gold)]/15 text-[var(--color-gold-bright)]"
            : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
        ].join(" ")}
      >
        <Icon size={20} />
      </span>
      <span
        className={[
          "text-[11px] text-center leading-tight line-clamp-2",
          looksDisabled
            ? "text-[var(--color-text-faint)] line-through"
            : active
            ? "text-[var(--color-gold-bright)] font-medium"
            : "text-[var(--color-text-muted)]",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}
