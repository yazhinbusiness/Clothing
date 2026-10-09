"use client";

import { PlusIcon, MinusIcon } from "@/components/ui/icons";

export default function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  min = 1,
  disabled = false,
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-2)]">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || value <= min}
        className="om-tap h-10 w-10 flex items-center justify-center rounded-full disabled:opacity-35 disabled:cursor-not-allowed hover:text-[var(--color-gold-bright)]"
      >
        <MinusIcon size={16} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className="om-tap h-10 w-10 flex items-center justify-center rounded-full disabled:opacity-35 disabled:cursor-not-allowed hover:text-[var(--color-gold-bright)]"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
