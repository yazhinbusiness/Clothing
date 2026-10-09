"use client";

import { CloseIcon, ChevronRightIcon } from "@/components/ui/icons";

/**
 * Static category list — there is no category service/table yet
 * (product_master has no category grouping in the current schema),
 * so this is a placeholder nav to be wired to real data later.
 */
const CATEGORIES = [
  { label: "Shop All", href: "/shop" },
  { label: "Shirts", href: "/shop?cat=SHIRTS", badge: "NEW" },
  { label: "Pants", href: "/shop?cat=PANTS" },
  { label: "Kurtis", href: "/shop?cat=KURTIS" },
  { label: "Short Kurtis", href: "/shop?cat=SHORT_KURTIS" },
];

function NavList({ activeHref = "#" }) {
  return (
    <nav className="flex flex-col gap-1">
      {CATEGORIES.map((cat) => {
        const active = cat.href === activeHref;
        return (
          <a
            key={cat.label}
            href={cat.href}
            className={[
              "om-tap group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium",
              active
                ? "bg-[var(--color-gold)] text-[var(--color-gold-contrast)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-2">
              {cat.label}
              {cat.badge ? (
                <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-[var(--color-gold-bright)] text-[var(--color-gold-contrast)]">
                  {cat.badge}
                </span>
              ) : null}
            </span>
            <ChevronRightIcon
              size={15}
              className="opacity-0 group-hover:opacity-60 transition-opacity"
            />
          </a>
        );
      })}
    </nav>
  );
}

function PromoCard() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface)] p-5">
      <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--color-gold-bright)]">
        Made to order
      </p>
      <p className="mt-1 font-[var(--font-display)] text-2xl leading-tight">
        Precision
        <br />
        is personal
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        Tailored corporate wear, built to your exact measurements.
      </p>
    </div>
  );
}

export default function CategoryNav({ open, onClose }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 px-2">
        <div className="sticky top-20">
          <NavList />
          <PromoCard />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={[
          "lg:hidden fixed inset-0 z-50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
          aria-hidden
        />
        <div
          className={[
            "absolute left-0 top-0 h-full w-[82%] max-w-xs bg-[var(--color-bg)] border-r border-[var(--color-border)]",
            "px-5 py-5 overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 font-[var(--font-display)] text-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-6 w-auto" draggable={false} />
              Oh <span className="text-[var(--color-gold-bright)]">Must</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="om-tap h-9 w-9 flex items-center justify-center rounded-full hover:text-[var(--color-gold-bright)]"
              aria-label="Close menu"
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <NavList />
          <PromoCard />
        </div>
      </div>
    </>
  );
}
