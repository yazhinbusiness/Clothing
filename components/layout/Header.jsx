"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  SearchIcon,
  MenuIcon,
  HeartIcon,
  BagIcon,
} from "@/components/ui/icons";

function Brand() {
  return (
    <Link
      href="/"
      aria-label="Oh Must home"
      className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" className="h-6 sm:h-8 w-auto shrink-0" draggable={false} />
      <span className="font-[var(--font-display)] text-[16px] min-[400px]:text-[18px] sm:text-[22px] tracking-[0.1em] sm:tracking-[0.12em] uppercase leading-none whitespace-nowrap">
        Oh Must
      </span>
    </Link>
  );
}

const iconBtn =
  "om-tap relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text)] hover:text-[var(--color-gold-bright)]";

export default function Header({ onMenuClick, cartCount = 0 }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  function submitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg)]/92 backdrop-blur border-b border-[var(--color-border)]">
      <div className="relative mx-auto max-w-7xl px-3 md:px-8 h-16 flex items-center">
        <button
          type="button"
          onClick={onMenuClick}
          className={`${iconBtn} lg:hidden`}
          aria-label="Open menu"
        >
          <MenuIcon size={24} />
        </button>

        {/* Sits right after the menu button on mobile (centering it left no
            room for the three icons on the right), left-aligned on desktop */}
        <div className="ml-1 min-w-0 lg:ml-0">
          <Brand />
        </div>

        {/* Desktop search */}
        <form
          onSubmit={submitSearch}
          className="hidden lg:flex flex-1 mx-8 max-w-md items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 h-11"
        >
          <SearchIcon size={17} className="text-[var(--color-text-faint)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-[var(--color-text-faint)]"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={`${iconBtn} lg:hidden`}
            aria-label="Search"
          >
            <SearchIcon size={22} />
          </button>
          <button type="button" className={`${iconBtn} hidden sm:inline-flex`} aria-label="Wishlist">
            <HeartIcon size={22} />
          </button>
          <Link href="/cart" aria-label="View bag" className={iconBtn}>
            <BagIcon size={22} />
            {cartCount > 0 ? (
              <span className="animate-pop-in absolute top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-gold)] text-[var(--color-gold-contrast)] text-[10px] font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {/* Mobile search row, opened by the search icon */}
      {searchOpen && (
        <form
          onSubmit={submitSearch}
          className="lg:hidden animate-fade-in mx-3 mb-3 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 h-11"
        >
          <SearchIcon size={17} className="text-[var(--color-text-faint)]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-[var(--color-text-faint)]"
          />
        </form>
      )}
    </header>
  );
}
