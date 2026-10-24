import { requireAdmin } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/server";

/** GET /api/admin/orders?stage=NEW|STITCHING|SHIPPED|DELIVERED|ALL&q=text  (admin only) */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const url = new URL(request.url);
    const stage = (url.searchParams.get("stage") || "ALL").toUpperCase();
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    const admin = serviceClient();
    let query = admin
      .from("checkout_sessions")
      .select(
        "id, email, status, fulfilment_status, paid_at, delivered_at, shipped_at, total_inr, items, shopify_order_name, courier, tracking_number"
      )
      .eq("status", "PAID")
      .order("paid_at", { ascending: false })
      .limit(300);
    if (["NEW", "STITCHING", "SHIPPED", "DELIVERED"].includes(stage)) {
      query = query.eq("fulfilment_status", stage);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows = data ?? [];
    if (q) {
      rows = rows.filter(
        (r) =>
          String(r.shopify_order_name ?? "").toLowerCase().includes(q) ||
          String(r.email ?? "").toLowerCase().includes(q) ||
          (r.items ?? []).some((i) => String(i.product_name ?? "").toLowerCase().includes(q))
      );
    }

    // counts per stage (for the tabs) + open remakes
    const { data: all } = await admin
      .from("checkout_sessions")
      .select("fulfilment_status")
      .eq("status", "PAID");
    const counts = { NEW: 0, STITCHING: 0, SHIPPED: 0, DELIVERED: 0 };
    for (const r of all ?? []) counts[r.fulfilment_status] = (counts[r.fulfilment_status] ?? 0) + 1;
    const { count: openRemakes } = await admin
      .from("remake_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["REQUESTED", "APPROVED", "IN_STITCHING"]);

    const orders = rows.map((r) => ({
      id: r.id,
      name: r.shopify_order_name,
      email: r.email,
      stage: r.fulfilment_status,
      paid_at: r.paid_at,
      delivered_at: r.delivered_at,
      total_inr: r.total_inr,
      courier: r.courier,
      tracking_number: r.tracking_number,
      lines: (r.items ?? []).map((i) => ({
        name: i.product_name,
        quantity: i.quantity,
        custom: i.measurement_mode === "CUSTOM",
      })),
    }));
    return Response.json({ orders, counts, openRemakes: openRemakes ?? 0 });
  } catch (err) {
    console.error("Admin orders list error:", err);
    return Response.json({ error: "Could not load orders." }, { status: 500 });
  }
}
