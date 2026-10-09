"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/icons";
import ShopifyGallery from "@/components/product/ShopifyGallery";

function formatPrice(amount, currencyCode) {
  const value = Number(amount);
  if (currencyCode === "INR") {
    return `₹${value.toLocaleString("en-IN")}`;
  }
  return `${currencyCode} ${value.toLocaleString()}`;
}

/**
 * Fallback for products with no garment data behind them yet (no
 * product_code mapping) — there's nothing to show disabled option
 * previews of, so this stays a simple photo + price + "coming soon"
 * view. Once a product is mapped, the route sends it to
 * ConfiguratorLoader/ProductDetails instead, which shows the full
 * option UI (and Shopify's photos) from the start.
 */
export default function ShopifyProductView({ shopifyProduct }) {
  const [wishlisted, setWishlisted] = useState(false);
  const price = shopifyProduct.priceRange?.minVariantPrice;

  return (
    <section className="pb-28 lg:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-10 px-4 sm:px-6 lg:px-0 pt-4">
        <ShopifyGallery
          images={shopifyProduct.images?.nodes ?? []}
          title={shopifyProduct.title}
        />

        <div className="om-stagger flex flex-col gap-6">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--color-gold-bright)] mb-1">
              New Arrival
            </p>
            <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl leading-tight">
              {shopifyProduct.title}
            </h1>
          </div>

          {price && (
            <span className="font-[var(--font-display)] text-3xl text-[var(--color-gold-bright)]">
              {formatPrice(price.amount, price.currencyCode)}
            </span>
          )}

          {shopifyProduct.descriptionHtml && (
            <div
              className="text-sm text-[var(--color-text-muted)] leading-relaxed [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: shopifyProduct.descriptionHtml }}
            />
          )}

          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setWishlisted((v) => !v)}
              aria-label="Wishlist"
            >
              <HeartIcon size={16} filled={wishlisted} />
            </Button>
            <Button variant="secondary" fullWidth disabled>
              Customization coming soon
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur px-4 py-3 flex items-center gap-3 animate-fade-up">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-[var(--color-text-faint)]">Price</span>
          <span className="font-[var(--font-display)] text-lg text-[var(--color-gold-bright)]">
            {price ? formatPrice(price.amount, price.currencyCode) : "—"}
          </span>
        </div>
        <Button variant="secondary" fullWidth className="!py-3" disabled>
          Coming soon
        </Button>
      </div>
    </section>
  );
}
