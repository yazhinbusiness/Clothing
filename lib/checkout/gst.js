/**
 * GST helpers — pure functions, safe on both server and client.
 *
 * Prices in Supabase (selling_price) are treated as the FINAL, GST-inclusive
 * price the customer sees. This module only SPLITS that price into
 * taxable value + GST for display and for the order record. It never changes
 * what the customer pays.
 *
 * Readymade garments (as of the 22 Sep 2025 GST revision):
 *   sale value up to Rs 2,500 per piece -> 5%,  above -> 18%.
 * The slab is decided on the pre-tax value per piece. Confirm with your CA.
 *
 * All maths is done in paise (integers) to avoid float drift.
 */
export const GST_LOW_RATE = 0.05;
export const GST_HIGH_RATE = 0.18;
export const GST_SLAB_LIMIT_RUPEES = 2500;

export const toPaise = (rupees) => Math.round(Number(rupees || 0) * 100);
export const toRupees = (paise) => paise / 100;

/** Rate for ONE piece priced `unitInclusiveRupees` (GST included). */
export function gstRateForUnitPrice(unitInclusiveRupees) {
  const preTaxIfLowRate = toPaise(unitInclusiveRupees) / (1 + GST_LOW_RATE);
  return preTaxIfLowRate <= GST_SLAB_LIMIT_RUPEES * 100
    ? GST_LOW_RATE
    : GST_HIGH_RATE;
}

/** Splits a GST-inclusive amount (paise) into { taxable, gst } (paise). */
export function splitInclusivePaise(totalPaise, rate) {
  const taxable = Math.round(totalPaise / (1 + rate));
  return { taxable, gst: totalPaise - taxable };
}

/**
 * @param {Array<{selling_price:number|string, quantity:number|string}>} items
 *        cart rows from get_cart_items
 * @param {{ shippingRupees?: number }} [opts]
 */
export function summarizeCart(items, { shippingRupees = 0 } = {}) {
  let totalPaise = 0;
  let taxablePaise = 0;
  let gstPaise = 0;
  const byRate = {};

  const lines = (items ?? []).map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPaise = toPaise(item.selling_price);
    const rate = gstRateForUnitPrice(item.selling_price);
    const linePaise = unitPaise * qty;
    const { taxable, gst } = splitInclusivePaise(linePaise, rate);

    totalPaise += linePaise;
    taxablePaise += taxable;
    gstPaise += gst;
    byRate[rate] = (byRate[rate] ?? 0) + gst;

    return {
      cartItemId: item.cart_item_id,
      quantity: qty,
      unitPaise,
      linePaise,
      rate,
      taxablePaise: taxable,
      gstPaise: gst,
    };
  });

  const shippingPaise = toPaise(shippingRupees);
  return {
    lines,
    byRate, // { 0.05: gstPaise, ... }
    itemsTotalPaise: totalPaise, // GST-inclusive
    taxablePaise,
    gstPaise,
    shippingPaise,
    grandTotalPaise: totalPaise + shippingPaise,
  };
}

export const formatINR = (paise) =>
  `₹${toRupees(paise).toLocaleString("en-IN", {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
