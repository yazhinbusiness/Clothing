"use client";

import { useEffect, useState } from "react";

import ProductDetails from "@/components/product/ProductDetails";

import {
  getProductByCode,
  getProductSizes,
  getProductOptions,
  getProductMaterials,
  getProductColorsForMaterial,
  getDefaultProductPrice,
  getProductGarmentCode,
} from "@/services/productService";
import { computePrice } from "@/lib/pricing/shirtPricing";
import {
  getCustomizerManifest,
  getPricingManifest,
} from "@/services/customizerService";

function groupProductOptions(options) {
  return options.reduce((groups, option) => {
    const groupCode = option.option_group_code;
    if (!groups[groupCode]) groups[groupCode] = [];
    groups[groupCode].push(option);
    return groups;
  }, {});
}

/**
 * Re-flags `is_default` on a materials/colors list so a specific
 * Shopify listing can override which one is pre-selected — without
 * touching ProductDetails' own default-selection logic at all (it
 * just reads whichever entry has is_default: true, same as always).
 */
function withDefaultOverride(list, overrideCode, codeKey) {
  if (!overrideCode) return list;
  const hasMatch = list.some((item) => item[codeKey] === overrideCode);
  if (!hasMatch) return list;

  return list.map((item) => ({
    ...item,
    is_default: item[codeKey] === overrideCode,
  }));
}

/**
 * Loads the Supabase-side garment/configurator data for a given
 * product_code and renders the live customizer (ProductDetails).
 * This is the exact logic that used to live inline in app/page.tsx —
 * only relocated and parameterized so any Shopify product mapped to a
 * product_code can use it, not just the one hardcoded homepage.
 */
export default function ConfiguratorLoader({
  productCode,
  defaultMaterialCode = null,
  defaultColorCode = null,
  defaultOptions = null,
  shopifyProduct = null,
}) {
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [options, setOptions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  const [defaultPrice, setDefaultPrice] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [pricingManifest, setPricingManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const groupedOptions = groupProductOptions(options);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        // Which garment (SHIRT, PANTS ...) this product is - picks the right
        // picture set and price formula.
        const garmentCode = await getProductGarmentCode(productCode);

        const [
          productData,
          sizeData,
          optionData,
          materialData,
          priceData,
          manifestData,
          pricingManifestData,
        ] = await Promise.all([
          getProductByCode(productCode),
          getProductSizes(productCode),
          getProductOptions(productCode),
          getProductMaterials(productCode),
          // The database "default price" function only knows shirts; for other
          // garments the price is worked out from the pricing manifest below.
          garmentCode === "SHIRT"
            ? getDefaultProductPrice({ productCode, sizeCode: "M" })
            : Promise.resolve(null),
          // Fetched ONCE here — this is what lets every option change
          // after this point be instant (image) and local (price),
          // with zero further network calls until Add to Bag.
          getCustomizerManifest(garmentCode),
          getPricingManifest(garmentCode),
        ]);

        const materialsWithOverride = withDefaultOverride(
          materialData,
          defaultMaterialCode,
          "material_code"
        );

        // Colors depend on which material ends up selected — resolve
        // the starting material first, then fetch only its palette.
        const startingMaterialCode =
          materialsWithOverride.find((m) => m.is_default)?.material_code ??
          materialsWithOverride[0]?.material_code ??
          null;

        const colorData = startingMaterialCode
          ? await getProductColorsForMaterial(productCode, startingMaterialCode)
          : [];

        if (
          defaultMaterialCode &&
          !materialData.some((m) => m.material_code === defaultMaterialCode)
        ) {
          console.warn(
            `[OhMust] Listing material "${defaultMaterialCode}" is not a material of ${productCode}. Available:`,
            materialData.map((m) => m.material_code)
          );
        }
        if (
          defaultColorCode &&
          !colorData.some((c) => c.color_code === defaultColorCode)
        ) {
          console.warn(
            `[OhMust] Listing colour "${defaultColorCode}" is not in product_material_color_map for ${productCode} / ${startingMaterialCode}. Available:`,
            colorData.map((c) => c.color_code)
          );
        }

        setProduct(productData);
        setSizes(sizeData);
        setOptions(optionData);
        setMaterials(materialsWithOverride);
        setColors(withDefaultOverride(colorData, defaultColorCode, "color_code"));
        let startingPrice = priceData;
        if (!startingPrice && pricingManifestData) {
          const defaults = Object.fromEntries(
            optionData
              .filter((o) => o.is_default)
              .map((o) => [o.option_group_code, o.option_value_code])
          );
          const size =
            sizeData.find((x) => x.size_code === "M")?.size_code ?? sizeData[0]?.size_code;
          const calc = computePrice(pricingManifestData, {
            sizeCode: size,
            materialCode: startingMaterialCode,
            options: defaults,
          });
          startingPrice = {
            selling_price: String(calc.sellingPrice),
            protected_price_floor: String(calc.protectedPriceFloor),
            max_discount_amount: String(calc.maxDiscountAmount),
            max_discount_percent: String(calc.maxDiscountPercent),
          };
        }
        setDefaultPrice(startingPrice);
        setManifest(manifestData);
        setPricingManifest(pricingManifestData);
      } catch (err) {
        console.error("Configurator loading error:", err);
        setError(err instanceof Error ? err.message : "Unable to load product.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productCode, defaultMaterialCode, defaultColorCode]);

  if (loading) {
    return (
      <div className="flex-1 px-4 py-16 flex flex-col items-center justify-center gap-3 text-center">
        <span className="h-10 w-10 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Loading customizer…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-4 py-16 text-center">
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 px-4 py-16 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Product not found.
        </p>
      </div>
    );
  }

  return (
    <ProductDetails
      product={product}
      sizes={sizes}
      options={groupedOptions}
      materials={materials}
      colors={colors}
      defaultPrice={defaultPrice}
      manifest={manifest}
      pricingManifest={pricingManifest}
      shopifyProduct={shopifyProduct}
      startingOptions={defaultOptions ?? {}}
    />
  );
}
