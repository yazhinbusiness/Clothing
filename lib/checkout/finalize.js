import { serviceClient, anonClient } from "@/lib/supabase/server";
import { getDraftOrderStatus } from "@/lib/shopify/admin";

/**
 * Looks at one PENDING checkout session, asks Shopify whether the draft order
 * has been paid, and if so records it and empties the customer's bag.
 * Safe to call repeatedly (idempotent).
 *
 * @returns {Promise<"PAID"|"PENDING"|"ERROR">}
 */
export async function reconcileSession(session) {
  if (session.status !== "PENDING" || !session.shopify_draft_order_id) {
    return session.status;
  }

  const draft = await getDraftOrderStatus(session.shopify_draft_order_id);
  const order = draft?.order;
  const paid =
    draft?.status === "COMPLETED" &&
    order &&
    ["PAID", "PARTIALLY_REFUNDED"].includes(order.displayFinancialStatus);

  if (!paid) return "PENDING";

  const admin = serviceClient();
  const { error } = await admin
    .from("checkout_sessions")
    .update({
      status: "PAID",
      paid_at: order.processedAt ?? new Date().toISOString(),
      shopify_order_id: order.id,
      shopify_order_name: order.name,
    })
    .eq("id", session.id)
    .eq("status", "PENDING"); // never flips twice

  if (error) throw new Error(`Could not record the paid order: ${error.message}`);

  // First "My size" order: remember it so the 15% offer and the free remake
  // are used exactly once per customer.
  if ((session.items ?? []).some((i) => i.measurement_mode === "CUSTOM")) {
    const { error: usedError } = await admin
      .from("custom_first_order_used")
      .upsert(
        { user_id: session.user_id, checkout_session_id: session.id },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
    if (usedError) {
      console.error("Could not record first custom order:", usedError.message);
    }
  }

  // Empty the bag: the order already holds its own frozen copy of the lines.
  const anon = anonClient();
  for (const item of session.items ?? []) {
    const { error: removeError } = await anon.rpc("remove_cart_item", {
      p_cart_item_id: item.cart_item_id,
      p_guest_cart_id: session.guest_cart_id,
    });
    if (removeError) {
      console.error("Paid order, but could not clear cart item:", removeError.message);
    }
  }
  return "PAID";
}
