"use client";

import { useEffect, useState } from "react";
import {
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "../../services/configurationService";

import StoreShell from "@/components/layout/StoreShell";
import Button from "@/components/ui/Button";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { TrashIcon, BagIcon } from "@/components/ui/icons";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

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

  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.line_total || 0),
    0
  );

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
                        {item.product_name}
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
                                {Number(measurement.measurementMm) / 10} cm
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
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-[var(--font-display)] text-xl text-[var(--color-gold-bright)]">
                  ₹{cartTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <Button variant="primary" fullWidth className="mt-5">
                Proceed to Checkout
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
              ₹{cartTotal.toLocaleString("en-IN")}
            </span>
          </div>
          <Button variant="primary" fullWidth className="!py-3">
            Checkout
          </Button>
        </div>
      )}
    </StoreShell>
  );
}
