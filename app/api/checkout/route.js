import { DELIVERY_DAYS, deliveryByText } from "@/lib/delivery/estimate";
import { createHash } from "node:crypto";
import { anonClient, serviceClient, getUserFromRequest } from "@/lib/supabase/server";
import { createDraftOrder } from "@/lib/shopify/admin";
import { summarizeCart, toRupees } from "@/lib/checkout/gst";

/**
 * POST /api/checkout   { guestCartId }   + Authorization: Bearer <supabase token>
 *
 * 1. Requires a signed-in customer.
 * 2. Re-reads the cart from Supabase (frozen prices) — nothing about money is
 *    taken from the browser.
 * 3. Creates a Shopify Draft Order, in INR, with one custom line per cart line
 *    (price = the GST-inclusive Supabase price, customisation as line properties).
 * 4. Returns { url } — Shopify's secure payment page.
 */
const CURRENCY = "INR";
const FREE_SHIPPING_TITLE = "Free shipping";

const money = (rupees) => ({
  amount: Number(rupees).toFixed(2),
  currencyCode: CURRENCY,
});

function lineProperties(item) {
  const props = [];
  const add = (key, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      props.push({ key, value: String(value) });
    }
  };

  if (item.measurement_mode === "CUSTOM") {
    add(
      "Measurements",
      (item.measurements ?? [])
        .map((m) => `${m.name}: ${Number(m.measurementMm) / 10} cm`)
        .join(", ")
    );
  } else {
    add("Size", item.size_code);
  }
  add("Material", item.material_code);
  add("Colour", item.color_code);
  for (const option of item.options ?? []) {
    add(option.groupCode, option.valueName ?? option.valueCode);
  }
  add("Configuration", item.configuration_id);
  add("Cart item", item.cart_item_id);
  return props;
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json(
        { error: "Please sign in to check out." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const guestCartId = String(body?.guestCartId ?? "");
    if (!guestCartId || guestCartId.length > 80) {
      return Response.json({ error: "Missing cart." }, { status: 400 });
    }

    // ---- authoritative cart (frozen prices) ----
    const { data: items, error: cartError } = await anonClient().rpc(
      "get_cart_items",
      { p_guest_cart_id: guestCartId }
    );
    if (cartError) throw new Error(cartError.message);
    if (!items?.length) {
      return Response.json({ error: "Your bag is empty." }, { status: 400 });
    }
    if (items.some((i) => !(Number(i.selling_price) > 0))) {
      return Response.json(
        { error: "A bag item has no valid price. Please remove it and add it again." },
        { status: 409 }
      );
    }

    // Listing titles remembered by the browser (display only, never price).
    const clean = (v) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 120);
    const titles = body?.titles && typeof body.titles === "object" ? body.titles : {};
    const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d{1,20}$/;
    for (const item of items) {
      const entry = titles[item.cart_item_id];
      const t = clean(typeof entry === "string" ? entry : entry?.title);
      if (t) item.product_name = t;
      const v = typeof entry === "object" ? String(entry?.variantId ?? "") : "";
      // Only used to show the product photo/title; the price is always ours.
      if (VARIANT_GID.test(v)) item.shopify_variant_id = v;
    }

    const summary = summarizeCart(items, { shippingRupees: 0 });

    // ---- don't create a second draft for an unchanged bag ----
    const itemsHash = createHash("sha256")
      .update(
        JSON.stringify(
          // "v3" = bump this whenever the draft-order shape changes (tax, titles,
          // shipping ...) so old pending drafts are not handed back.
          [
            "v4",
            ...items.map((i) => [i.cart_item_id, i.quantity, i.selling_price, i.product_name]),
          ]
        )
      )
      .digest("hex");

    const admin = serviceClient();
    const { data: existing } = await admin
      .from("checkout_sessions")
      .select("id, invoice_url, created_at")
      .eq("user_id", user.id)
      .eq("guest_cart_id", guestCartId)
      .eq("items_hash", itemsHash)
      .eq("status", "PENDING")
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    if (existing?.[0]?.invoice_url) {
      return Response.json({ url: existing[0].invoice_url, reused: true });
    }

    // ---- Shopify draft order ----
    const gstNote = Object.entries(summary.byRate)
      .map(([rate, paise]) => `GST ${Math.round(rate * 100)}%: ₹${toRupees(paise).toFixed(2)}`)
      .join(", ");

    const draft = await createDraftOrder({
      email: user.email,
      presentmentCurrencyCode: CURRENCY,
      // Our prices already include GST. Without this Shopify can add its own
      // tax on top (depending on store tax settings) and the total would no
      // longer match the bag.
      taxExempt: true,
      tags: ["ohmust", "made-to-order"],
      note:
        `Oh Must made-to-order. Delivery within ${DELIVERY_DAYS} days (by ${deliveryByText()}). Prices include GST. ` +
        `Taxable value ₹${toRupees(summary.taxablePaise).toFixed(2)}; ${gstNote}.`,
      shippingLine: { title: FREE_SHIPPING_TITLE, priceWithCurrency: money(0) },
      lineItems: items.map((item) => {
        const base = {
          quantity: Math.max(1, Number(item.quantity) || 1),
          customAttributes: lineProperties(item),
        };
        // Real Shopify variant: Shopify shows its photo and title. Our
        // Supabase price replaces the catalogue price.
        if (item.shopify_variant_id) {
          return {
            ...base,
            variantId: item.shopify_variant_id,
            priceOverride: money(item.selling_price),
          };
        }
        // Fallback: plain custom line (no photo).
        return {
          ...base,
          title: [item.product_name, [item.color_code, item.material_code].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(" — "),
          originalUnitPriceWithCurrency: money(item.selling_price),
          requiresShipping: true,
          taxable: true,
        };
      }),
    });

    // ---- remember it (this row is also the order record) ----
    const { error: insertError } = await admin.from("checkout_sessions").insert({
      user_id: user.id,
      email: user.email,
      guest_cart_id: guestCartId,
      items_hash: itemsHash,
      items,
      items_total_inr: toRupees(summary.itemsTotalPaise),
      taxable_inr: toRupees(summary.taxablePaise),
      gst_inr: toRupees(summary.gstPaise),
      shipping_inr: 0,
      total_inr: toRupees(summary.grandTotalPaise),
      shopify_draft_order_id: draft.id,
      shopify_draft_order_name: draft.name,
      invoice_url: draft.invoiceUrl,
    });
    if (insertError) {
      // The draft exists in Shopify but we couldn't log it — still let them pay.
      console.error("checkout_sessions insert failed:", insertError.message);
    }

    return Response.json({ url: draft.invoiceUrl });
  } catch (err) {
    console.error("Checkout error:", err);
    return Response.json(
      { error: "We couldn't start checkout. Please try again in a moment." },
      { status: 500 }
    );
  }
}
