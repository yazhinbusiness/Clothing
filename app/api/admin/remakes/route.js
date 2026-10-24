import { requireAdmin } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/server";

/** GET /api/admin/remakes?status=OPEN|ALL|<status>  (admin only) */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const url = new URL(request.url);
    const status = (url.searchParams.get("status") || "OPEN").toUpperCase();
    const admin = serviceClient();
    let query = admin
      .from("remake_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status === "OPEN") query = query.in("status", ["REQUESTED", "APPROVED", "IN_STITCHING"]);
    else if (status !== "ALL") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const ids = [...new Set((data ?? []).map((r) => r.checkout_session_id))];
    const orders = {};
    if (ids.length) {
      const { data: sessions } = await admin
        .from("checkout_sessions")
        .select("id, shopify_order_name, email, items, delivered_at")
        .in("id", ids);
      for (const s of sessions ?? []) orders[s.id] = s;
    }
    const remakes = (data ?? []).map((r) => {
      const s = orders[r.checkout_session_id];
      const item = (s?.items ?? []).find((i) => i.cart_item_id === r.cart_item_id);
      return {
        ...r,
        order_name: s?.shopify_order_name ?? null,
        email: s?.email ?? null,
        product_name: item?.product_name ?? null,
        measurement_names: Object.fromEntries(
          (item?.measurements ?? []).map((m) => [m.code, m.name])
        ),
      };
    });
    return Response.json({ remakes });
  } catch (err) {
    console.error("Admin remakes list error:", err);
    return Response.json({ error: "Could not load remakes." }, { status: 500 });
  }
}
