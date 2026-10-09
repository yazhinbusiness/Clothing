"use client";

import { CheckIcon } from "@/components/ui/icons";

export default function ColorSwatch({
  hex = "#999999",
  active = false,
  disabled = false,
  busy = false,
  locked = false,
  onClick,
  onLockedClick,
  title,
}) {
  const isLight = isLightColor(hex);
  const looksDisabled = disabled || locked;

  return (
    <button
      type="button"
      title={title}
      onClick={locked ? onLockedClick : onClick}
      disabled={disabled || busy}
      aria-label={title}
      className={[
        "om-tap relative h-9 w-9 rounded-full flex items-center justify-center",
        "ring-offset-2 ring-offset-[var(--color-bg)] transition-all",
        active ? "ring-2 ring-[var(--color-gold)]" : "ring-1 ring-[var(--color-border-strong)]",
        looksDisabled ? `opacity-35 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}` : "",
      ].join(" ")}
      style={{ backgroundColor: hex }}
    >
      {active ? (
        <CheckIcon
          size={15}
          className="animate-pop-in"
          style={{ color: isLight ? "#1a1a1a" : "#fff" }}
        />
      ) : null}
    </button>
  );
}

function isLightColor(hex) {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
