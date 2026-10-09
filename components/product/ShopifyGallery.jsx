"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

export default function ShopifyGallery({ images, title }) {
  const [index, setIndex] = useState(0);
  const safeImages = images.length ? images : [{ url: null, altText: title }];
  const current = safeImages[index];

  return (
    <div className="animate-fade-up relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-6 overflow-hidden">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--color-surface-2)] flex items-center justify-center">
        {current.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.altText ?? title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-[var(--color-text-faint)]">
            No image available
          </span>
        )}

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() =>
                setIndex((i) => (i - 1 + safeImages.length) % safeImages.length)
              }
              className="om-tap absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[var(--color-bg)]/70 flex items-center justify-center"
            >
              <ChevronLeftIcon size={18} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setIndex((i) => (i + 1) % safeImages.length)}
              className="om-tap absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[var(--color-bg)]/70 flex items-center justify-center"
            >
              <ChevronRightIcon size={18} />
            </button>
          </>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {safeImages.map((img, i) => (
            <button
              key={img.url ?? i}
              type="button"
              onClick={() => setIndex(i)}
              className={[
                "om-tap shrink-0 h-14 w-14 rounded-xl overflow-hidden border-2",
                i === index
                  ? "border-[var(--color-gold)]"
                  : "border-transparent opacity-60",
              ].join(" ")}
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
