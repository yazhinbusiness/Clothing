import { serviceClient, getUserFromRequest } from "@/lib/supabase/server";
import { reconcileSession } from "@/lib/checkout/finalize";

/**
 * POST /api/orders/sync  (signed-in)
 * Checks this customer's unpaid checkouts with Shopify and records any that
 * have been paid. The orders page calls it on open — no webhook/tunnel needed
 * while developing. (Add a Shopify "orders/paid" webhook before launch so
 * orders are recorded even if the customer never comes back.)
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

    const admin = serviceClient();
    const { data: pending, error } = await admin
      .from("checkout_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);

    let paid = 0;
    for (const session of pending ?? []) {
      try {
        if ((await reconcileSession(session)) === "PAID") paid += 1;
      } catch (err) {
        console.error("Reconcile failed for", session.id, err);
      }
    }
    return Response.json({ checked: pending?.length ?? 0, paid });
  } catch (err) {
    console.error("Orders sync error:", err);
    return Response.json({ error: "Could not refresh orders." }, { status: 500 });
  }
}
