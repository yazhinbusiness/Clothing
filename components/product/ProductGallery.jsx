"use client";

import { useState } from "react";
import { HeartIcon, ShareIcon, CheckIcon } from "@/components/ui/icons";
import IconButton from "@/components/ui/IconButton";

export default function ProductGallery({
  badgeLabel,
  children,
  isBusy = false,
  justUpdated = false,
}) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <div
      className={[
        "relative rounded-3xl border bg-[var(--color-surface)] p-3 sm:p-6 overflow-hidden",
        "animate-fade-up transition-shadow duration-300",
        justUpdated
          ? "border-[var(--color-gold)] shadow-[0_0_0_4px_rgba(209,164,86,0.18)]"
          : "border-[var(--color-border)]",
      ].join(" ")}
    >
      {badgeLabel ? (
        <span className="absolute top-4 left-4 z-10 rounded-full bg-[var(--color-gold)] text-[var(--color-gold-contrast)] text-[11px] font-semibold tracking-wide px-3 py-1.5 shadow-[var(--shadow-pop)]">
          {badgeLabel}
        </span>
      ) : null}

      {justUpdated ? (
        <span
          key="updated-chip"
          className="animate-pop-in absolute top-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 border border-[var(--color-success)]/40 text-[var(--color-success)] text-[11px] font-medium px-2.5 py-1"
        >
          <CheckIcon size={12} />
          Updated
        </span>
      ) : null}

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <IconButton
          size={38}
          active={wishlisted}
          onClick={() => setWishlisted((v) => !v)}
          aria-label="Add to wishlist"
        >
          <HeartIcon size={17} filled={wishlisted} />
        </IconButton>
        <IconButton size={38} aria-label="Share">
          <ShareIcon size={17} />
        </IconButton>
      </div>

      <div className="relative flex items-center justify-center">
        <div
          className="animate-float relative z-10 w-full"
          style={{ opacity: isBusy ? 0.55 : 1, transition: "opacity 0.25s ease" }}
        >
          {children}
        </div>
        {/* floating platform shadow, like the reference product shots */}
        <div
          aria-hidden
          className="absolute bottom-0 h-8 w-[70%] rounded-full blur-xl"
          style={{ background: "radial-gradient(ellipse, rgba(209,164,86,0.28), transparent 70%)" }}
        />
      </div>

      {isBusy ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/40 backdrop-blur-[1px]">
          <span className="h-9 w-9 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
