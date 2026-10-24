import { requireAdmin } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getOrderContact } from "@/lib/shopify/admin";
import { summarizeCart } from "@/lib/checkout/gst";

const STAGES = ["NEW", "STITCHING", "SHIPPED", "DELIVERED"];
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

/** GET /api/admin/orders/:id - everything needed to stitch and ship one order (admin only). */
export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const admin = serviceClient();
    const { data: order, error } = await admin
      .from("checkout_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    // cost / profit per line, from the frozen price snapshot of its configuration
    const configIds = (order.items ?? []).map((i) => i.configuration_id).filter(Boolean);
    const snaps = {};
    if (configIds.length) {
      const { data } = await admin
        .from("configuration_price_snapshot")
        .select("configuration_id, full_cost, fixed_profit_amount, additional_profit_amount, selling_price, created_at")
        .in("configuration_id", configIds)
        .order("created_at", { ascending: false });
      for (const s of data ?? []) if (!snaps[s.configuration_id]) snaps[s.configuration_id] = s;
    }

    const summary = summarizeCart(order.items ?? [], { shippingRupees: Number(order.shipping_inr) || 0 });
    const lines = (order.items ?? []).map((item, idx) => {
      const snap = snaps[item.configuration_id];
      const qty = Math.max(1, Number(item.quantity) || 1);
      const l = summary.lines[idx];
      return {
        ...item,
        line_total: Number(item.selling_price) * qty,
        gst_rate: l?.rate ?? null,
        gst_inr: l ? l.gstPaise / 100 : null,
        cost_inr: snap ? Number(snap.full_cost) * qty : null,
        profit_inr: snap
          ? (Number(snap.fixed_profit_amount) + Number(snap.additional_profit_amount)) * qty
          : null,
      };
    });

    const { data: remakes } = await admin
      .from("remake_requests")
      .select("*")
      .eq("checkout_session_id", id)
      .order("created_at", { ascending: false });

    const contact = order.shopify_order_id ? await getOrderContact(order.shopify_order_id) : null;
    const storeDomain = process.env.SHOPIFY_ADMIN_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "";
    const orderNumericId = String(order.shopify_order_id ?? "").split("/").pop();

    return Response.json({
      order: {
        id: order.id,
        name: order.shopify_order_name,
        email: order.email,
        stage: order.fulfilment_status,
        paid_at: order.paid_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at,
        courier: order.courier,
        tracking_number: order.tracking_number,
        admin_notes: order.admin_notes,
        items_total_inr: order.items_total_inr,
        taxable_inr: order.taxable_inr,
        gst_inr: order.gst_inr,
        shipping_inr: order.shipping_inr,
        total_inr: order.total_inr,
        gst_by_rate: Object.fromEntries(
          Object.entries(summary.byRate).map(([rate, paise]) => [rate, paise / 100])
        ),
        shopify_admin_url:
          storeDomain && orderNumericId
            ? `https://${storeDomain}/admin/orders/${orderNumericId}`
            : null,
      },
      lines,
      contact,
      remakes: remakes ?? [],
    });
  } catch (err) {
    console.error("Admin order detail error:", err);
    return Response.json({ error: "Could not load this order." }, { status: 500 });
  }
}

/** PATCH /api/admin/orders/:id  { stage?, courier?, trackingNumber?, adminNotes? } (admin only) */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const admin = serviceClient();
    const { data: order } = await admin
      .from("checkout_sessions")
      .select("id, status, fulfilment_status, delivered_at, shipped_at, stitching_at, courier, tracking_number")
      .eq("id", id)
      .maybeSingle();
    if (!order || order.status !== "PAID") {
      return Response.json({ error: "Paid order not found." }, { status: 404 });
    }

    const patch = {};
    if (body.adminNotes !== undefined) patch.admin_notes = clean(body.adminNotes, 2000) || null;
    if (body.courier !== undefined) patch.courier = clean(body.courier, 80) || null;
    if (body.trackingNumber !== undefined) patch.tracking_number = clean(body.trackingNumber, 80) || null;

    if (body.stage !== undefined) {
      const stage = String(body.stage).toUpperCase();
      if (!STAGES.includes(stage)) {
        return Response.json({ error: "Unknown stage." }, { status: 400 });
      }
      const now = new Date().toISOString();
      const courier = patch.courier ?? order.courier;
      const tracking = patch.tracking_number ?? order.tracking_number;
      if (stage === "SHIPPED" && (!courier || !tracking)) {
        return Response.json(
          { error: "Add the courier and tracking number before marking it shipped." },
          { status: 400 }
        );
      }
      patch.fulfilment_status = stage;
      // timestamps are set once, on first arrival at that stage
      if (stage === "STITCHING" && !order.stitching_at) patch.stitching_at = now;
      if (stage === "SHIPPED" && !order.shipped_at) patch.shipped_at = now;
      if (stage === "DELIVERED") {
        if (!order.shipped_at) patch.shipped_at = now;
        // starts the customer's 15-day remake window
        if (!order.delivered_at) patch.delivered_at = now;
      }
      // moving back from Delivered re-opens it (and the remake window)
      if (stage !== "DELIVERED" && order.delivered_at) patch.delivered_at = null;
    }

    if (!Object.keys(patch).length) {
      return Response.json({ error: "Nothing to change." }, { status: 400 });
    }
    const { error } = await admin.from("checkout_sessions").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Admin order update error:", err);
    return Response.json({ error: "Could not save the change." }, { status: 500 });
  }
}
