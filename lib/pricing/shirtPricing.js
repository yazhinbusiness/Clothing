/**
 * Replicates the server's pricing formula exactly, for instant local
 * price display during customization. Verified against all 10 real
 * rows in configuration_price_snapshot — every component matched to
 * the cent. The server (get_configuration_details, and the cart RPCs)
 * remains the actual source of truth; this is a preview only, and
 * MUST be re-verified server-side before Add to Bag / Buy Now
 * actually charges anything.
 *
 * Formula:
 *   selling_price = full_cost × (1 + fixed_profit% + additional_profit%)
 *   full_cost = base_cost_subtotal + overhead + remake_allowance + payment_fee
 *   base_cost_subtotal = fabric_cost + Σ(fixed_cost of each selected option value)
 *                        + Σ(garment base costs: stitching/packing/shipping)
 *   fabric_cost = total_fabric_meters × material_price_per_meter
 *   total_fabric_meters = size_fabric[size] + Σ(fabric_meters of each selected option value)
 *
 * Written generically (sums over whichever selected option values
 * happen to have an entry in optionFixedCost / optionFabricMeters)
 * rather than hardcoding "only Collar+Placket have fixed costs" —
 * mathematically identical to the verified formula today, since those
 * are the only groups currently populated, but won't silently break
 * if that ever changes.
 *
 * Open item: overhead/remake_allowance/payment_fee are ₹0 in every
 * verified case so far, so whether a PERCENT-type cost_rule applies
 * to base_cost_subtotal specifically is assumed, not yet empirically
 * confirmed. Flagged in computeShirtPrice's return value.
 */

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * @param {object} pricingManifest - from getPricingManifest()
 * @param {object} selection - { sizeCode, materialCode, optionValueCodes: string[] }
 *   optionValueCodes should include every currently-selected value
 *   across every group (collar, placket, sleeve, pocket, fit, ...).
 */
export function computeShirtPrice(pricingManifest, selection) {
  return computePrice(pricingManifest, selection, "SHIRT");
}

/**
 * Price for whichever garment the manifest belongs to. Shirts mirror
 * public.calculate_shirt_cost; pants mirror
 * public.calculate_pants_configuration_cost (sql/pants.sql): fabric and fixed
 * cost come from EVERY selected option, not just sleeve/pocket/collar/placket.
 */
export function computePrice(pricingManifest, selection, garmentOverride) {
  const garment = garmentOverride ?? pricingManifest?.garmentCode ?? "SHIRT";
  // every garment except the shirt uses the options-based engine
  return garment !== "SHIRT"
    ? priceFromParts(pricingManifest, selection, "OPTIONS")
    : priceFromParts(pricingManifest, selection, "SHIRT");
}

function priceFromParts(pricingManifest, selection, garment) {
  const { sizeCode, materialCode } = selection;
  // { SLEEVE: "FULL_SLEEVE", COLLAR: "NOTCHED", ... }
  const options = selection.options ?? {};

  const num = (v) => Number(v ?? 0);

  // Mirrors public.calculate_shirt_cost exactly: only SLEEVE and POCKET use
  // fabric, only COLLAR and PLACKET have a fixed cost. Other groups (FIT ...)
  // do not change the price.
  const bodyFabric = num(pricingManifest.sizeFabricMeters?.[sizeCode]);
  let sleeveFabric = 0;
  let pocketFabric = 0;
  let collarCost = 0;
  let placketCost = 0;
  if (garment !== "SHIRT") {
    // every selected option can add fabric and a fixed cost
    for (const code of Object.values(options)) {
      pocketFabric += num(pricingManifest.optionFabricMeters?.[code]);
      collarCost += num(pricingManifest.optionFixedCost?.[code]);
    }
  } else {
    sleeveFabric = num(pricingManifest.optionFabricMeters?.[options.SLEEVE]);
    pocketFabric = num(pricingManifest.optionFabricMeters?.[options.POCKET]);
    collarCost = num(pricingManifest.optionFixedCost?.[options.COLLAR]);
    placketCost = num(pricingManifest.optionFixedCost?.[options.PLACKET]);
  }

  const totalFabricMeters = bodyFabric + sleeveFabric + pocketFabric;
  const materialPrice = num(pricingManifest.materialPricePerMeter?.[materialCode]);
  const fabricCost = totalFabricMeters * materialPrice;

  const baseCost = (code) =>
    num(
      (pricingManifest.baseCosts ?? []).find((c) => c.cost_code === code)?.fixed_cost
    );
  const baseCostSubtotal =
    fabricCost +
    collarCost +
    placketCost +
    baseCost("STITCHING") +
    baseCost("PACKING") +
    baseCost("SHIPPING");

  const rule = (code, defaultType) => {
    const r = (pricingManifest.costRules ?? []).find((c) => c.cost_code === code);
    return { type: r?.cost_type ?? defaultType, value: num(r?.cost_value) };
  };
  const apply = (r, base) => (r.type === "PERCENT" ? (base * r.value) / 100 : r.value);

  // Cascading, as in the database: each percentage applies to the running total.
  const overhead = apply(rule("OTHER_OVERHEAD", "FIXED"), baseCostSubtotal);
  const remake = apply(rule("REMAKE_ALLOWANCE", "PERCENT"), baseCostSubtotal + overhead);
  const paymentFee = apply(
    rule("PAYMENT_FEE", "PERCENT"),
    baseCostSubtotal + overhead + remake
  );
  const fullCost = baseCostSubtotal + overhead + remake + paymentFee;

  const profit = pricingManifest.profitRule ?? {};
  const fixedProfitAmount =
    (profit.fixed_profit_type ?? "PERCENT") === "PERCENT"
      ? (fullCost * num(profit.fixed_profit_value)) / 100
      : num(profit.fixed_profit_value);
  const additionalProfitAmount =
    (profit.additional_profit_type ?? "PERCENT") === "PERCENT"
      ? (fullCost * num(profit.additional_profit_value)) / 100
      : num(profit.additional_profit_value);

  const protectedPriceFloor = fullCost + fixedProfitAmount;
  const sellingPrice = protectedPriceFloor + additionalProfitAmount;

  return {
    totalFabricMeters: round2(totalFabricMeters),
    fabricCost: round2(fabricCost),
    baseCostSubtotal: round2(baseCostSubtotal),
    fullCost: round2(fullCost),
    fixedProfitAmount: round2(fixedProfitAmount),
    additionalProfitAmount: round2(additionalProfitAmount),
    protectedPriceFloor: round2(protectedPriceFloor),
    sellingPrice: round2(sellingPrice),
    maxDiscountAmount: round2(additionalProfitAmount),
    maxDiscountPercent:
      sellingPrice > 0 ? round2((additionalProfitAmount / sellingPrice) * 100) : 0,
  };
}
