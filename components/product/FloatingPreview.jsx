"use client";

import { CheckIcon } from "@/components/ui/icons";

export default function FloatingPreview({ visible, justUpdated, onTap, children }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="Scroll back to full product image"
      className={[
        "lg:hidden fixed left-4 z-30 h-[124px] w-[124px] rounded-2xl overflow-hidden",
        "border bg-[var(--color-surface)] shadow-[var(--shadow-card)]",
        "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        justUpdated ? "border-[var(--color-gold)]" : "border-[var(--color-border)]",
        visible
          ? "bottom-[84px] opacity-100 scale-100 pointer-events-auto"
          : "bottom-[56px] opacity-0 scale-75 pointer-events-none",
      ].join(" ")}
    >
      {/* No scaling/cropping — the canvas is width:100% + aspect-square,
          so it exactly fills this square button showing the FULL
          garment. The text summary that normally sits below the
          canvas in ShirtCustomizer starts right at the button's lower
          edge, so overflow-hidden clips it off without touching the
          image itself. */}
      <span className="block h-full w-full pointer-events-none">
        {children}
      </span>

      {justUpdated ? (
        <span className="animate-pop-in absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center">
          <CheckIcon size={11} />
        </span>
      ) : null}
    </button>
  );
}
