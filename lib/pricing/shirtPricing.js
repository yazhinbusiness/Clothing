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
  const { sizeCode, materialCode, optionValueCodes } = selection;

  const sizeFabric = Number(pricingManifest.sizeFabricMeters?.[sizeCode] ?? 0);
  const materialPrice = Number(
    pricingManifest.materialPricePerMeter?.[materialCode] ?? 0
  );

  let optionFabric = 0;
  let optionFixed = 0;
  let usedUnverifiedPercentRule = false;

  for (const code of optionValueCodes) {
    optionFabric += Number(pricingManifest.optionFabricMeters?.[code] ?? 0);
    optionFixed += Number(pricingManifest.optionFixedCost?.[code] ?? 0);
  }

  const totalFabricMeters = sizeFabric + optionFabric;
  const fabricCost = totalFabricMeters * materialPrice;

  const baseCostsFixed = (pricingManifest.baseCosts ?? []).reduce(
    (sum, c) => sum + Number(c.fixed_cost ?? 0),
    0
  );

  const baseCostSubtotal = fabricCost + optionFixed + baseCostsFixed;

  let ruleTotal = 0;
  for (const rule of pricingManifest.costRules ?? []) {
    const value = Number(rule.cost_value ?? 0);
    if (rule.cost_type === "FIXED") {
      ruleTotal += value;
    } else if (rule.cost_type === "PERCENT") {
      if (value !== 0) usedUnverifiedPercentRule = true;
      ruleTotal += baseCostSubtotal * (value / 100);
    }
  }

  const fullCost = baseCostSubtotal + ruleTotal;

  const profit = pricingManifest.profitRule ?? {};
  const fixedProfitPct = Number(profit.fixed_profit_value ?? 0);
  const additionalProfitPct = Number(profit.additional_profit_value ?? 0);

  const fixedProfitAmount = fullCost * (fixedProfitPct / 100);
  const additionalProfitAmount = fullCost * (additionalProfitPct / 100);

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
    // True only if a non-zero PERCENT cost_rule was actually used —
    // the one part of this formula not yet empirically verified.
    usedUnverifiedPercentRule,
  };
}
