"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "../../services/configurationService";

import { getGuestCartId } from "@/lib/cart/guestCart";
import { readCartTitles, cartTitleOf } from "@/lib/cart/titles";
import { getCustomSizeOffer } from "@/lib/measurements/api";
import RemakePromise from "@/components/measurements/RemakePromise";
import DeliveryEstimate from "@/components/delivery/DeliveryEstimate";
import { useAuth } from "@/lib/auth/useAuth";
import { summarizeCart, formatINR } from "@/lib/checkout/gst";
import StoreShell from "@/components/layout/StoreShell";
import Button from "@/components/ui/Button";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { TrashIcon, BagIcon } from "@/components/ui/icons";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [titles, setTitles] = useState({});
  useEffect(() => setTitles(readCartTitles()), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();
  // What the customer could save by using My size on their standard-size lines.
  const [potentialSaving, setPotentialSaving] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const standard = cartItems.filter((i) => i.measurement_mode !== "CUSTOM");
    if (standard.length === 0) {
      setPotentialSaving(0);
      return undefined;
    }
    Promise.all(
      standard.map((i) =>
        getCustomSizeOffer(i.configuration_id)
          .then((o) => (o?.eligible ? Number(o.saving) * Number(i.quantity || 1) : 0))
          .catch(() => 0)
      )
    ).then((list) => {
      if (!cancelled) setPotentialSaving(Math.floor(list.reduce((a, b) => a + b, 0)));
    });
    return () => {
      cancelled = true;
    };
  }, [cartItems, user?.id]);

  useEffect(() => {
    async function loadCart() {
      try {
        setLoading(true);
        setError("");

        const items = await getCartItems();

        setCartItems(items);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  async function handleRemove(cartItemId) {
    try {
      setRemovingId(cartItemId);
      setError("");

      await removeCartItem(cartItemId);

      setCartItems((currentItems) =>
        currentItems.filter(
          (item) => item.cart_item_id !== cartItemId
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleQuantityChange(item, newQuantity) {
    if (newQuantity < 1) {
      return;
    }

    try {
      setUpdatingId(item.cart_item_id);
      setError("");

      await updateCartItemQuantity(
        item.cart_item_id,
        newQuantity
      );

      setCartItems((currentItems) =>
        currentItems.map((cartItem) => {
          if (cartItem.cart_item_id !== item.cart_item_id) {
            return cartItem;
          }

          return {
            ...cartItem,
            quantity: newQuantity,
            line_total: Number(cartItem.selling_price) * newQuantity,
          };
        })
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  /*
   * CHECKOUT — login is required. The server re-reads the bag from Supabase
   * and builds the Shopify draft order; we only send the bag id + our login.
   */
  async function handleCheckout() {
    if (authLoading) return;
    if (!user) {
      router.push("/login?next=/cart");
      return;
    }
    try {
      setCheckingOut(true);
      setError("");
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ guestCartId: getGuestCartId(), titles: readCartTitles() }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push("/login?next=/cart");
        return;
      }
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to start checkout.");
      }
      window.location.href = result.url; // Shopify's secure payment page
    } catch (err) {
      console.error(err);
      setError(err.message);
      setCheckingOut(false);
    }
  }

  const summary = summarizeCart(cartItems);

  return (
    <StoreShell cartCount={cartItems.length} hideBottomNav>
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-0 py-6 pb-32 lg:pb-10">
        <h1 className="font-[var(--font-display)] text-3xl mb-6">
          Your Bag
        </h1>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span className="h-6 w-6 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
            Loading your bag…
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        )}

        {!loading && !error && cartItems.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
            <BagIcon size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              Your bag is empty.
            </p>
            <a
              href="/"
              className="text-sm text-[var(--color-gold-bright)] font-medium"
            >
              Continue shopping →
            </a>
          </div>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div className="om-stagger flex flex-col gap-4">
              {cartItems.map((item) => (
                <div
                  key={item.cart_item_id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-[var(--font-display)] text-lg">
                        {cartTitleOf(titles[item.cart_item_id]) ?? item.product_name}
                      </h2>

                      {item.measurement_mode === "CUSTOM" ? (
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                          <span className="font-medium text-[var(--color-text)]">
                            Custom measurements
                          </span>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            {item.measurements?.map((measurement) => (
                              <span key={measurement.code}>
                                {measurement.name}:{" "}
                                {Number(measurement.measurementMm)} mm
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          Standard size:{" "}
                          <span className="text-[var(--color-text)]">
                            {item.size_code}
                          </span>
                        </p>
                      )}

                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {item.material_code} · {item.color_code}
                      </p>

                      {item.options?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--color-text-faint)]">
                          {item.options.map((option) => (
                            <span key={option.groupCode}>
                              {option.groupCode}: {option.valueName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.cart_item_id)}
                      disabled={removingId === item.cart_item_id}
                      className="om-tap h-9 w-9 shrink-0 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-faint)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/50 disabled:opacity-40"
                      aria-label="Remove item"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <QuantityStepper
                      value={Number(item.quantity)}
                      min={1}
                      disabled={updatingId === item.cart_item_id}
                      onDecrease={() =>
                        handleQuantityChange(item, Number(item.quantity) - 1)
                      }
                      onIncrease={() =>
                        handleQuantityChange(item, Number(item.quantity) + 1)
                      }
                    />

                    <div className="text-right">
                      <p className="text-[11px] text-[var(--color-text-faint)]">
                        ₹{Number(item.selling_price).toLocaleString("en-IN")}{" "}
                        each
                      </p>
                      <p className="font-[var(--font-display)] text-lg text-[var(--color-gold-bright)]">
                        ₹{Number(item.line_total).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sticky top-20">
              <h2 className="font-[var(--font-display)] text-xl mb-4">
                Order Summary
              </h2>
              <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>Price (before GST)</span>
                <span>{formatINR(summary.taxablePaise)}</span>
              </div>
              {Object.entries(summary.byRate).map(([rate, paise]) => (
                <div
                  key={rate}
                  className="mt-2 flex items-center justify-between text-sm text-[var(--color-text-muted)]"
                >
                  <span>GST ({Math.round(Number(rate) * 100)}%)</span>
                  <span>{formatINR(paise)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>Shipping</span>
                <span className="text-[var(--color-success)]">Free</span>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-[var(--font-display)] text-xl text-[var(--color-gold-bright)]">
                  {formatINR(summary.grandTotalPaise)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-faint)] text-right">
                Inclusive of all taxes
              </p>
              {potentialSaving > 0 && (
                <div className="mt-4 rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-surface-2)] p-3 text-xs">
                  <p className="font-medium text-[var(--color-success)]">
                    You could save ₹{potentialSaving.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    Order made to your own measurements and get 15% off your first My size
                    order. Open the item, choose <em>My size</em> and enter your measurements.
                  </p>
                </div>
              )}
              <DeliveryEstimate className="mt-3" />
              <div className="mt-3">
                <RemakePromise compact />
              </div>
              <Button
                variant="primary"
                fullWidth
                className="mt-5"
                loading={checkingOut}
                onClick={handleCheckout}
              >
                {user || authLoading ? "Proceed to Checkout" : "Sign in to Checkout"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {!loading && !error && cartItems.length > 0 && (
        <div className="animate-fade-up lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-[var(--color-text-faint)]">
              Total
            </span>
            <span className="font-[var(--font-display)] text-lg text-[var(--color-gold-bright)]">
              {formatINR(summary.grandTotalPaise)}
            </span>
          </div>
          <Button
            variant="primary"
            fullWidth
            className="!py-3"
            loading={checkingOut}
            onClick={handleCheckout}
          >
            {user || authLoading ? "Checkout" : "Sign in to Checkout"}
          </Button>
        </div>
      )}
    </StoreShell>
  );
}
