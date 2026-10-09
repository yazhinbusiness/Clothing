"use client";

import { useMemo, useState } from "react";

import ProductCard from "@/components/shop/ProductCard";
import { SlidersIcon, ChevronDownIcon } from "@/components/ui/icons";
import {
  CATEGORIES,
  productCategory,
  productColorNames,
  tagValues,
} from "@/lib/shop/productHelpers";

const EMPTY_FILTERS = { material: "", color: "", fit: "", sleeve: "" };

function unique(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

/** A reference-style filter pill: native <select> (great on mobile) with a chevron. */
function Pill({ label, value, options, onChange }) {
  if (options.length === 0) return null;
  const active = Boolean(value);
  return (
    <label
      className={[
        "relative shrink-0 inline-flex items-center rounded-full border text-[13px]",
        active
          ? "border-[var(--color-gold)] text-[var(--color-gold-bright)]"
          : "border-[var(--color-border-strong)] text-[var(--color-text-muted)]",
      ].join(" ")}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none bg-transparent h-10 pl-4 pr-9 rounded-full outline-none cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={14}
        className="pointer-events-none absolute right-3"
      />
    </label>
  );
}

export default function ShopGrid({
  products,
  loadError,
  initialCategory = "ALL",
  initialQuery = "",
}) {
  const [category, setCategory] = useState(
    CATEGORIES.some((c) => c.code === initialCategory) ? initialCategory : "ALL"
  );
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState("featured");
  const [query, setQuery] = useState(initialQuery);

  const inCategory = useMemo(
    () =>
      category === "ALL"
        ? products
        : products.filter((p) => productCategory(p) === category),
    [products, category]
  );

  // Filter choices come from what the visible products actually carry
  // (tags like material:Cotton, fit:Regular, sleeve:Bell, color:Navy),
  // so they work automatically for bulk-uploaded products.
  const options = useMemo(
    () => ({
      material: unique(inCategory.flatMap((p) => tagValues(p, "material"))),
      color: unique(inCategory.flatMap((p) => productColorNames(p))),
      fit: unique(inCategory.flatMap((p) => tagValues(p, "fit"))),
      sleeve: unique(inCategory.flatMap((p) => tagValues(p, "sleeve"))),
    }),
    [inCategory]
  );

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const has = (list, value) =>
      list.some((v) => v.toLowerCase() === value.toLowerCase());

    let list = inCategory.filter((p) => {
      if (q) {
        const hay = [p.title, p.productType, ...(p.tags ?? [])]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.material && !has(tagValues(p, "material"), filters.material)) return false;
      if (filters.fit && !has(tagValues(p, "fit"), filters.fit)) return false;
      if (filters.sleeve && !has(tagValues(p, "sleeve"), filters.sleeve)) return false;
      if (filters.color && !has(productColorNames(p), filters.color)) return false;
      return true;
    });

    const price = (p) => Number(p.priceRange?.minVariantPrice?.amount ?? 0);
    list = [...list];
    if (sortBy === "price-low") list.sort((a, b) => price(a) - price(b));
    else if (sortBy === "price-high") list.sort((a, b) => price(b) - price(a));
    else if (sortBy === "name") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [inCategory, filters, sortBy, query]);

  const activeCount =
    Object.values(filters).filter(Boolean).length + (query.trim() ? 1 : 0);
  const cat = CATEGORIES.find((c) => c.code === category);
  const heroImage =
    inCategory.find((p) => p.featuredImage?.url)?.featuredImage?.url ?? null;

  function selectCategory(code) {
    setCategory(code);
    setFilters(EMPTY_FILTERS);
  }

  return (
    <div className="pb-6">
      {/* ---------- HERO BANNER ---------- */}
      <section className="animate-fade-up relative mx-4 sm:mx-6 lg:mx-0 mt-4 rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] min-h-[200px] sm:min-h-[260px]">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-y-0 right-0 h-full w-[60%] object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)] via-[var(--color-bg)]/85 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center min-h-[200px] sm:min-h-[260px] px-6 sm:px-10 py-6 max-w-[62%]">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-gold-bright)] mb-2">
            {cat ? cat.label : "All collections"}
          </p>
          <h1 className="font-[var(--font-display)] text-[30px] sm:text-5xl leading-[1.08]">
            {cat ? cat.blurb : "Precision is personal."}
          </h1>
          <p className="mt-2 text-[13px] text-[var(--color-text-muted)] max-w-xs">
            {cat ? cat.sub : "Made-to-measure clothing, designed by you."}
          </p>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-0">
        {/* ---------- CATEGORY TABS ---------- */}
        <div className="mt-4 flex gap-7 overflow-x-auto no-scrollbar border-b border-[var(--color-border)]">
          {[{ code: "ALL", label: "All" }, ...CATEGORIES].map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => selectCategory(c.code)}
              className={[
                "om-tap shrink-0 pb-3 pt-2 text-[15px] font-medium border-b-2 -mb-px transition-colors",
                category === c.code
                  ? "border-[var(--color-gold)] text-[var(--color-gold-bright)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              ].join(" ")}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* ---------- FILTER ROW ---------- */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setQuery("");
            }}
            className={[
              "om-tap shrink-0 inline-flex items-center gap-2 h-10 px-3 text-[13px] font-medium",
              activeCount ? "text-[var(--color-gold-bright)]" : "text-[var(--color-text)]",
            ].join(" ")}
          >
            <SlidersIcon size={17} />
            {activeCount ? `Clear (${activeCount})` : "Filters"}
          </button>

          <Pill label="Material" value={filters.material} options={options.material}
            onChange={(v) => setFilters((f) => ({ ...f, material: v }))} />
          <Pill label="Color" value={filters.color} options={options.color}
            onChange={(v) => setFilters((f) => ({ ...f, color: v }))} />
          <Pill label="Fit" value={filters.fit} options={options.fit}
            onChange={(v) => setFilters((f) => ({ ...f, fit: v }))} />
          <Pill label="Sleeve" value={filters.sleeve} options={options.sleeve}
            onChange={(v) => setFilters((f) => ({ ...f, sleeve: v }))} />

          <label className="relative ml-auto shrink-0 inline-flex items-center text-[13px] text-[var(--color-text-muted)] pl-3 border-l border-[var(--color-border)]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort by"
              className="appearance-none bg-transparent h-10 pl-1 pr-7 outline-none cursor-pointer"
            >
              <option value="featured">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
            <ChevronDownIcon size={14} className="pointer-events-none absolute right-1" />
          </label>
        </div>

        <p className="mt-3 mb-3 text-xs text-[var(--color-text-faint)]">
          {visibleProducts.length} Product{visibleProducts.length === 1 ? "" : "s"}
          {query.trim() ? ` for “${query.trim()}”` : ""}
        </p>

        {/* ---------- GRID ---------- */}
        {loadError ? (
          <p className="text-sm text-[var(--color-danger)]">
            Couldn&apos;t load products: {loadError}
          </p>
        ) : visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              {activeCount
                ? "No products match these filters."
                : `${cat ? cat.label : "Products"} are coming soon.`}
            </p>
          </div>
        ) : (
          <div className="om-stagger grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
