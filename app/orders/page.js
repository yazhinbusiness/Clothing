"use client";

import { deliveryDate, formatDeliveryDate } from "@/lib/delivery/estimate";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import StoreShell from "@/components/layout/StoreShell";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/useAuth";
import MeasurementModal from "@/components/measurements/MeasurementModal";
import { getMeasurementForm, requestRemake } from "@/lib/measurements/api";

const REMAKE_WINDOW_DAYS = 15; // keep in step with request_remake() in sql/measurements.sql
const REMAKE_LIMIT_MM = 20; // 20 mm either way

const REMAKE_LABEL = {
  REQUESTED: "Remake requested",
  APPROVED: "Remake approved",
  IN_STITCHING: "Remake being stitched",
  SHIPPED: "Remake shipped",
  REJECTED: "Remake not approved",
};
const STAGE_LABEL = {
  NEW: "Order received",
  STITCHING: "Being stitched",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

const inr = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function OrdersPage() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [firstCustomSessionId, setFirstCustomSessionId] = useState(null);
  const [remakes, setRemakes] = useState({}); // cart_item_id -> status
  const [remakeTarget, setRemakeTarget] = useState(null); // { order, item }
  const [measurementForm, setMeasurementForm] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/orders");
      return;
    }
    let active = true;
    (async () => {
      try {
        // Ask Shopify whether any unpaid checkout has been paid since.
        await fetch("/api/orders/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => {});

        const { data, error: err } = await supabase
          .from("checkout_sessions")
          .select(
            "id, status, fulfilment_status, courier, tracking_number, created_at, paid_at, delivered_at, total_inr, gst_inr, items, invoice_url, shopify_order_name, shopify_draft_order_name"
          )
          .order("created_at", { ascending: false });
        if (err) throw err;
        if (active) setOrders(data ?? []);

        // free-remake bookkeeping (these tables only return the signed-in customer's rows)
        const [{ data: used }, { data: remakeRows }] = await Promise.all([
          supabase.from("custom_first_order_used").select("checkout_session_id").maybeSingle(),
          supabase.from("remake_requests").select("cart_item_id, status, admin_note, courier, tracking_number"),
        ]);
        if (active) {
          setFirstCustomSessionId(used?.checkout_session_id ?? null);
          setRemakes(Object.fromEntries((remakeRows ?? []).map((r) => [r.cart_item_id, r])));
        }
      } catch (err) {
        if (active) setError(err.message || "Could not load your orders.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user, accessToken, router]);

  async function openRemake(order, item) {
    try {
      if (measurementForm.length === 0) setMeasurementForm(await getMeasurementForm());
      setRemakeTarget({ order, item });
    } catch (err) {
      setError(err.message || "Could not open the remake form.");
    }
  }

  const remakeOriginal = Object.fromEntries(
    (remakeTarget?.item?.measurements ?? []).map((m) => [m.code, Number(m.measurementMm)])
  );
  const remakeLimits = Object.fromEntries(
    Object.entries(remakeOriginal).map(([code, mm]) => [
      code,
      { min: mm - REMAKE_LIMIT_MM, max: mm + REMAKE_LIMIT_MM },
    ])
  );

  return (
    <StoreShell hideBottomNav>
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-0 py-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-[var(--font-display)] text-3xl">Your orders</h1>
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold-bright)]"
            >
              Sign out ({user.email})
            </button>
          ) : null}
        </div>

        {loading && (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        )}
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              No orders yet.
            </p>
            <Link href="/shop" className="text-sm text-[var(--color-gold-bright)]">
              Start shopping →
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const paid = order.status === "PAID";
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-[var(--font-display)] text-lg">
                      {paid
                        ? `Order ${order.shopify_order_name ?? ""}`
                        : `Awaiting payment ${order.shopify_draft_order_name ?? ""}`}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(order.paid_at ?? order.created_at).toLocaleString("en-IN")}
                    </p>
                    {paid ? (
                      <p className="mt-0.5 text-xs text-[var(--color-gold-bright)]">
                        {order.delivered_at
                          ? `Delivered ${formatDeliveryDate(new Date(order.delivered_at))}`
                          : `Delivery by ${formatDeliveryDate(deliveryDate(order.paid_at ?? order.created_at))}`}
                      </p>
                    ) : null}
                    {paid && order.fulfilment_status ? (
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {STAGE_LABEL[order.fulfilment_status] ?? ""}
                        {order.tracking_number ? ` · ${order.courier ?? ""} ${order.tracking_number}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium border ${
                      paid
                        ? "border-[var(--color-success)]/40 text-[var(--color-success)]"
                        : "border-[var(--color-gold)]/40 text-[var(--color-gold-bright)]"
                    }`}
                  >
                    {paid ? "Paid" : "Payment pending"}
                  </span>
                </div>

                <ul className="mt-3 text-sm text-[var(--color-text-muted)] list-disc pl-5">
                  {(order.items ?? []).map((item) => (
                    <li key={item.cart_item_id}>
                      {item.quantity} × {item.product_name} — {item.color_code}{" "}
                      {item.material_code}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-faint)]">
                    Includes GST {inr(order.gst_inr)}
                  </span>
                  <span className="font-[var(--font-display)] text-lg text-[var(--color-gold-bright)]">
                    {inr(order.total_inr)}
                  </span>
                </div>

                {paid && order.id === firstCustomSessionId && (
                  <div className="mt-4 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-surface-2)] p-3 text-xs">
                    <p className="font-medium text-[var(--color-gold-bright)]">
                      Free remake on this order
                    </p>
                    <p className="mt-1 text-[var(--color-text-muted)]">
                      Not happy with the stitching or fit? Ask within {REMAKE_WINDOW_DAYS} days
                      of delivery. You can change each measurement by up to 20 mm (2 cm, about ¾ inch). We collect
                      the original. No refunds or returns on made-to-measure garments.
                    </p>
                    {(order.items ?? [])
                      .filter((i) => i.measurement_mode === "CUSTOM")
                      .map((item) => {
                        const status = remakes[item.cart_item_id];
                        const deadline = order.delivered_at
                          ? new Date(order.delivered_at).getTime() + REMAKE_WINDOW_DAYS * 86400000
                          : null;
                        const open = deadline && Date.now() <= deadline;
                        return (
                          <div key={item.cart_item_id} className="mt-3 flex items-center justify-between gap-3">
                            <span>{item.product_name}</span>
                            {status ? (
                              <span className={status.status === "REJECTED" ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}>
                                {REMAKE_LABEL[status.status] ?? "Remake requested"}
                                {status.status === "REJECTED" && status.admin_note ? `: ${status.admin_note}` : ""}
                                {status.status === "SHIPPED" && status.tracking_number ? ` (${status.courier ?? ""} ${status.tracking_number})` : ""}
                                {status.status !== "REJECTED" && status.admin_note ? ` - ${status.admin_note}` : ""}
                              </span>
                            ) : !order.delivered_at ? (
                              <span className="text-[var(--color-text-faint)]">Available once delivered</span>
                            ) : !open ? (
                              <span className="text-[var(--color-text-faint)]">Window ended</span>
                            ) : (
                              <Button className="!px-4 !py-2 !text-xs" onClick={() => openRemake(order, item)}>
                                Request remake
                              </Button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                {!paid && order.invoice_url ? (
                  <div className="mt-4">
                    <a href={order.invoice_url}>
                      <Button fullWidth>Complete payment</Button>
                    </a>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>

      <MeasurementModal
        open={Boolean(remakeTarget)}
        mode="remake"
        onClose={() => setRemakeTarget(null)}
        form={measurementForm}
        initialValues={remakeOriginal}
        limits={remakeLimits}
        title="Free remake"
        submitLabel="Send remake request"
        onSubmit={async ({ values }) => {
          await requestRemake({
            sessionId: remakeTarget.order.id,
            cartItemId: remakeTarget.item.cart_item_id,
            values,
          });
          setRemakes((r) => ({ ...r, [remakeTarget.item.cart_item_id]: { status: "REQUESTED" } }));
          setRemakeTarget(null);
        }}
      />
    </StoreShell>
  );
}
