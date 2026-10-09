import Link from "next/link";

import StoreShell from "@/components/layout/StoreShell";
import ProductCard from "@/components/shop/ProductCard";
import { getShopifyProducts } from "@/lib/shopify/catalog";
import { CATEGORIES, productCategory } from "@/lib/shop/productHelpers";
import {
  CollarIcon,
  SleeveIcon,
  FitIcon,
  PaletteIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

const CUSTOMIZE_HIGHLIGHTS = [
  { icon: CollarIcon, title: "Collar", detail: "Classic, Mandarin, Peter Pan & more" },
  { icon: SleeveIcon, title: "Sleeve", detail: "Full, 3/4, Puff, Bell & more" },
  { icon: FitIcon, title: "Fit", detail: "Regular, Fitted, Loose & more" },
  { icon: PaletteIcon, title: "Color", detail: "Timeless shades for every mood" },
];

function SectionHeading({
  title,
  href = "/shop",
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <h2 className="font-[var(--font-display)] text-[26px] leading-none">
        {title}
      </h2>
      <span className="hidden sm:block flex-1 h-px bg-gradient-to-r from-[var(--color-gold)]/60 to-transparent" />
      <Link
        href={href}
        className="ml-auto sm:ml-0 flex items-center gap-1 text-xs text-[var(--color-gold-bright)]"
      >
        View All <ArrowRightIcon size={13} />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  let loadError = "";

  try {
    products = await getShopifyProducts(20);
  } catch (err) {
    console.error("Failed to load Shopify products:", err);
    loadError = err instanceof Error ? err.message : "Unable to load products.";
  }

  const heroImage =
    products.find((p) => p.featuredImage?.url)?.featuredImage?.url ?? null;

  return (
    <StoreShell>
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-0">
        {/* ---------- HERO ---------- */}
        <section className="animate-fade-up relative mt-4 rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] min-h-[360px] sm:min-h-[440px]">
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-[72%] object-cover object-top"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)] via-[var(--color-bg)]/85 to-transparent" />

          <div className="relative z-10 flex flex-col justify-center min-h-[360px] sm:min-h-[440px] px-6 sm:px-12 py-10 max-w-[64%] sm:max-w-[52%]">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-gold-bright)] mb-3">
              Customizable Clothing
            </p>
            <h1 className="font-[var(--font-display)] text-[40px] sm:text-6xl leading-[1.05]">
              Precision
              <br />
              is personal.
            </h1>
            <p className="mt-4 text-sm text-[var(--color-text-muted)] max-w-xs">
              Made-to-measure clothing designed by you.
            </p>
            <Link
              href="/shop"
              className="om-tap mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-medium text-[var(--color-gold-contrast)] shadow-[var(--shadow-pop)] hover:bg-[var(--color-gold-bright)]"
            >
              Explore Collections <ArrowRightIcon size={15} />
            </Link>
            <div className="mt-6 flex gap-2" aria-hidden>
              <span className="h-[3px] w-9 rounded-full bg-[var(--color-gold)]" />
              <span className="h-[3px] w-9 rounded-full bg-[var(--color-border-strong)]" />
            </div>
          </div>
        </section>

        {/* ---------- SHOP BY CATEGORY ---------- */}
        <section className="mt-10">
          <SectionHeading title="Shop by Category" />
          <div className="om-stagger grid grid-cols-4 gap-2.5 sm:gap-4">
            {CATEGORIES.map((cat) => {
              const rep = products.find(
                (p) => productCategory(p) === cat.code && p.featuredImage?.url
              );
              return (
                <Link
                  key={cat.code}
                  href={`/shop?cat=${cat.code}`}
                  className="om-tap group relative aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-surface)] hover:border-[var(--color-gold)]/50 transition-colors"
                >
                  {rep && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rep.featuredImage.url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2 flex items-center justify-between gap-1 text-[12px] sm:text-sm font-medium">
                    <span className="truncate">{cat.label}</span>
                    <ArrowRightIcon size={13} className="shrink-0 text-[var(--color-gold-bright)]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---------- DESIGNED YOUR WAY ---------- */}
        <section className="mt-10 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-5 sm:p-7">
          <h2 className="font-[var(--font-display)] text-[28px] leading-none">
            Designed Your Way
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Customize every detail, from collar to color.
          </p>

          <div className="om-stagger mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {CUSTOMIZE_HIGHLIGHTS.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-bg)] p-4"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold-bright)] mb-3">
                  <Icon size={19} />
                </span>
                <p className="font-[var(--font-display)] text-lg leading-none">
                  {title}
                </p>
                <p className="mt-1.5 text-[11.5px] text-[var(--color-text-muted)] leading-snug">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- NEW ARRIVALS ---------- */}
        <section className="mt-10">
          <SectionHeading title="New Arrivals" />

          {loadError ? (
            <p className="text-sm text-[var(--color-danger)]">
              Couldn&apos;t load products: {loadError}
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No products yet.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {products.slice(0, 12).map((product) => (
                <ProductCard key={product.id} product={product} variant="rail" />
              ))}
            </div>
          )}
        </section>
      </main>
    </StoreShell>
  );
}
