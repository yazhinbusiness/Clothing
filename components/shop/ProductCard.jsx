"use client";

import { useState } from "react";
import Link from "next/link";

import { HeartIcon, ArrowRightIcon, SlidersIcon } from "@/components/ui/icons";
import {
  formatPrice,
  productBadge,
  productColorNames,
  productMeta,
  swatchHex,
} from "@/lib/shop/productHelpers";

function Wishlist({ className = "" }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-label="Add to wishlist"
      onClick={(e) => {
        e.preventDefault();
        setOn((v) => !v);
      }}
      className={[
        "om-tap absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-[var(--color-bg)]/60 backdrop-blur-sm flex items-center justify-center",
        on ? "text-[var(--color-gold-bright)]" : "text-[var(--color-text)]",
        className,
      ].join(" ")}
    >
      <HeartIcon size={15} filled={on} />
    </button>
  );
}

function Photo({ product, children }) {
  return (
    <div className="relative aspect-[3/4] bg-[var(--color-surface-2)] overflow-hidden">
      {product.featuredImage?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-[var(--color-text-faint)] text-xs">
          No image
        </div>
      )}
      {children}
    </div>
  );
}

export default function ProductCard({ product, variant = "grid" }) {
  const badge = productBadge(product);
  const colors = productColorNames(product);
  const price = product.priceRange?.minVariantPrice;
  const href = `/product/${product.handle}`;

  const dots = colors.slice(0, 4).map((name) => (
    <span
      key={name}
      title={name}
      className="h-3.5 w-3.5 rounded-full border border-white/25"
      style={{ backgroundColor: swatchHex(name) }}
    />
  ));

  /* ---------- Home "New Arrivals" rail ---------- */
  if (variant === "rail") {
    return (
      <Link
        href={href}
        className="om-tap group shrink-0 snap-start w-[158px] sm:w-[200px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-gold)]/50 transition-colors"
      >
        <Photo product={product}>
          <Wishlist />
        </Photo>
        <div className="p-2.5">
          <p className="text-[13px] font-medium truncate">{product.title}</p>
          <p className="text-[10.5px] text-[var(--color-text-faint)] truncate">
            {productMeta(product)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-gold-bright)]">
            {price ? formatPrice(price.amount, price.currencyCode) : ""}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex gap-1">{dots}</div>
            <span className="h-6 w-6 rounded-full border border-[var(--color-gold)]/60 text-[var(--color-gold-bright)] flex items-center justify-center">
              <ArrowRightIcon size={12} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  /* ---------- Shop grid ---------- */
  return (
    <div className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-gold)]/50 transition-colors">
      <Link href={href} className="block">
        <Photo product={product}>
          {badge && (
            <span className="absolute top-2 left-2 z-10 rounded-full bg-[var(--color-gold)] text-[var(--color-gold-contrast)] text-[10px] font-bold tracking-wide px-2 py-1">
              {badge}
            </span>
          )}
          <Wishlist />
          {dots.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              {colors.slice(0, 4).map((name) => (
                <span
                  key={name}
                  title={name}
                  className="h-5 w-5 rounded-full border-2 border-white/70"
                  style={{ backgroundColor: swatchHex(name) }}
                />
              ))}
            </div>
          )}
        </Photo>

        <div className="p-3 pb-2">
          <p className="font-[var(--font-display)] text-[17px] leading-tight truncate">
            {product.title}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-faint)] truncate">
            {productMeta(product)}
          </p>
          <p className="mt-1.5 text-[15px] text-[var(--color-text)]">
            {price ? formatPrice(price.amount, price.currencyCode) : ""}
          </p>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <Link
          href={href}
          className="om-tap flex items-center justify-center gap-2 w-full rounded-full border border-[var(--color-gold)]/60 py-2.5 text-[13px] font-medium text-[var(--color-gold-bright)] hover:bg-[var(--color-gold)]/10"
        >
          <SlidersIcon size={14} />
          Customize
          <ArrowRightIcon size={13} className="ml-auto mr-1" />
        </Link>
      </div>
    </div>
  );
}
