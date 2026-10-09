"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import CategoryNav from "@/components/layout/CategoryNav";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { getCartItems } from "@/services/configurationService";

export const CART_UPDATED_EVENT = "oh-must:cart-updated";

/**
 * cartCount is optional — pass it explicitly (e.g. from the cart page,
 * which already has the authoritative list) to skip the extra fetch.
 * Everywhere else, StoreShell fetches it itself and keeps it live by
 * listening for CART_UPDATED_EVENT, so the header badge reflects
 * reality instead of silently staying at 0 after an add-to-cart.
 */
export default function StoreShell({
  children,
  cartCount = undefined,
  // Pages with their own sticky action bar (product, cart) hide the
  // mobile bottom navigation so the two don't stack.
  hideBottomNav = false,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fetchedCount, setFetchedCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    try {
      const items = await getCartItems();
      setFetchedCount(items.length);
    } catch (err) {
      console.error("Failed to refresh cart count:", err);
    }
  }, []);

  useEffect(() => {
    if (cartCount !== undefined) return; // caller supplies the count
    refreshCartCount();
    window.addEventListener(CART_UPDATED_EVENT, refreshCartCount);
    return () => window.removeEventListener(CART_UPDATED_EVENT, refreshCartCount);
  }, [cartCount, refreshCartCount]);

  const displayedCartCount = cartCount !== undefined ? cartCount : fetchedCount;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Header onMenuClick={() => setDrawerOpen(true)} cartCount={displayedCartCount} />

      <div className="mx-auto w-full max-w-7xl flex-1 flex px-0 lg:px-8 lg:gap-6 lg:py-6">
        <CategoryNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        {children}
      </div>

      <Footer extraBottomPadding={hideBottomNav} />

      {!hideBottomNav && (
        <>
          {/* keeps the footer clear of the fixed bar */}
          <div className="h-16 lg:hidden" aria-hidden />
          <BottomNav
            cartCount={displayedCartCount}
            onMenu={() => setDrawerOpen(true)}
          />
        </>
      )}
    </div>
  );
}
