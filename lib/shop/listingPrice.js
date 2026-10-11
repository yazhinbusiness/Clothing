import { getProductOptions, getProductMaterials, getProductSizes } from "@/services/productService";
import { getPricingManifest } from "@/services/customizerService";
import { computeShirtPrice } from "@/lib/pricing/shirtPricing";
import { resolveOptionCode } from "@/lib/shop/optionMatch";
import { getConfiguratorMapping } from "@/lib/shopify/catalog";

/**
 * Listing price = the same Supabase price the product page shows for the
 * listing's starting look (tags: material / fit / sleeve / collar / ...),
 * size M. Shopify's own variant price is NOT used for display, so the shop
 * grid, the product page and the cart can't drift apart.
 */
const GARMENT_CODE = "SHIRT";
const TTL_MS = 5 * 60 * 1000;
let manifestCache = { at: 0, value: null };
const productCache = new Map(); // productCode -> { at, value }

async function loadManifest() {
  if (manifestCache.value && Date.now() - manifestCache.at < TTL_MS) return manifestCache.value;
  const value = await getPricingManifest(GARMENT_CODE);
  manifestCache = { at: Date.now(), value };
  return value;
}

async function loadProductData(productCode) {
  const hit = productCache.get(productCode);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const [options, materials, sizes] = await Promise.all([
    getProductOptions(productCode),
    getProductMaterials(productCode),
    getProductSizes(productCode),
  ]);
  const groups = {};
  for (const o of options) (groups[o.option_group_code] ??= []).push(o);
  const value = { groups, materials, sizes };
  productCache.set(productCode, { at: Date.now(), value });
  return value;
}

async function priceFor(product, manifest) {
  const mapping = await getConfiguratorMapping(product);
  if (!mapping?.productCode) return null;
  const { groups, materials, sizes } = await loadProductData(mapping.productCode);

  const materialCode =
    (mapping.defaultMaterialCode &&
      materials.find((m) => m.material_code === mapping.defaultMaterialCode)?.material_code) ||
    materials.find((m) => m.is_default)?.material_code ||
    materials[0]?.material_code;
  const sizeCode = sizes.find((s) => s.size_code === "M")?.size_code ?? sizes[0]?.size_code ?? "M";

  const options = Object.fromEntries(
    Object.entries(groups).map(([group, list]) => {
      const wanted = mapping.defaultOptions?.[group];
      const fromTag = wanted ? resolveOptionCode(list, wanted) : null;
      return [
        group,
        fromTag ?? list.find((o) => o.is_default)?.option_value_code ?? list[0]?.option_value_code,
      ];
    })
  );

  const result = computeShirtPrice(manifest, { sizeCode, materialCode, options });
  const amount = Number(result?.sellingPrice);
  return amount > 0 ? amount : null;
}

/** Returns the products with priceRange replaced by the Supabase price. */
export async function withSupabasePrices(products) {
  let manifest;
  try {
    manifest = await loadManifest();
  } catch (err) {
    console.error("Listing prices: pricing manifest unavailable, keeping Shopify prices.", err.message);
    return products;
  }
  return Promise.all(
    products.map(async (product) => {
      try {
        const amount = await priceFor(product, manifest);
        if (!amount) return product;
        const money = { amount: String(amount), currencyCode: "INR" };
        return { ...product, priceRange: { ...product.priceRange, minVariantPrice: money, maxVariantPrice: money } };
      } catch (err) {
        console.error(`Listing price failed for ${product.handle}:`, err.message);
        return product;
      }
    })
  );
}
