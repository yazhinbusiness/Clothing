"use client";

import { HeartIcon, FabricIcon } from "@/components/ui/icons";

/**
 * TODO: wire to a real catalog/recommendation source once
 * product_master exposes more than one sellable product.
 * Placeholder cards intentionally show no fabricated price/name.
 */
const PLACEHOLDER_COUNT = 4;

export default function RelatedProducts() {
  return (
    <section className="animate-fade-up">
      <h2 className="font-[var(--font-display)] text-xl mb-3">
        You May Also Like
      </h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
          <div
            key={i}
            className="om-tap shrink-0 w-36 sm:w-44 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 hover:border-[var(--color-gold)]/50 hover:-translate-y-0.5 transition-transform"
          >
            <div className="relative aspect-square rounded-xl bg-[var(--color-surface-3)] flex items-center justify-center mb-2">
              <FabricIcon size={22} className="text-[var(--color-text-faint)]" />
              <button
                type="button"
                className="om-tap absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-[var(--color-surface)]/80 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-gold-bright)]"
                aria-label="Add to wishlist"
              >
                <HeartIcon size={13} />
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-faint)]">
              More styles coming soon
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
