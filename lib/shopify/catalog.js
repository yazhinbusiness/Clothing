import { shopifyStorefront } from "@/lib/shopify/storefront";
import { getActiveMappingForShopifyProduct } from "@/services/productMappingService";

/**
 * Namespace for the custom metafields merchants set on each Shopify
 * product to drive the configurator (see docs/bulk-product-metafields.md
 * for the full setup + CSV bulk-import guide). Shopify auto-assigns
 * "custom" as the namespace for definitions created via Settings →
 * Custom data → Products in the Admin UI — if yours ends up different,
 * this is the only line that needs to change.
 */
const METAFIELD_NAMESPACE = "custom";

const METAFIELD_KEYS = {
  productCode: "product_code",
  defaultMaterialCode: "default_material_code",
  defaultColorCode: "default_color_code",
  isActive: "is_active",
};

const METAFIELD_IDENTIFIERS = Object.values(METAFIELD_KEYS)
  .map((key) => `{namespace: "${METAFIELD_NAMESPACE}", key: "${key}"}`)
  .join(", ");

/**
 * Hardcoded last-resort fallback only — real mappings live in either
 * the product's own Shopify metafields (bulk-set at creation time) or
 * the shopify_product_mapping table (see sql/shopify_product_mapping.sql
 * and /admin/shopify-mappings, for one-off manual overrides). This
 * stays as a safety net in case both of those are empty.
 */
const FALLBACK_MAPPING = {
  "gid://shopify/Product/10774429860134": "WHITE_COTTON_SHIRT",
};

function readMetafieldMapping(shopifyProduct) {
  const fields = shopifyProduct?.metafields ?? [];
  const byKey = {};
  for (const field of fields) {
    if (field) byKey[field.key] = field.value;
  }

  const productCode = byKey[METAFIELD_KEYS.productCode];
  if (!productCode) return null;

  return {
    productCode,
    defaultMaterialCode: byKey[METAFIELD_KEYS.defaultMaterialCode] || null,
    defaultColorCode: byKey[METAFIELD_KEYS.defaultColorCode] || null,
    // Metafield "value" is always a string, even for a boolean-typed
    // definition — absent means "not set", treated as active.
    isActive: byKey[METAFIELD_KEYS.isActive] !== "false",
  };
}

/**
 * Garment type -> the Supabase product_code that powers its customizer.
 *
 * This is what makes bulk uploads painless: set a Shopify product's
 * "Product type" (or add a tag) to the garment name — e.g. Shirt — and
 * the listing automatically gets the Shirt customizer. No per-product
 * database work, no GIDs to look up.
 *
 * Add one line here as each new customizer is built (Pants, Kurti,
 * Short Kurti) once its product_code exists in Supabase.
 */
const GARMENT_TYPE_PRODUCT_CODES = [
  { keywords: ["shirt"], productCode: "WHITE_COTTON_SHIRT" },
];

function singular(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return v.endsWith("s") ? v.slice(0, -1) : v;
}

function readTagValue(tags, key) {
  const prefix = `${key}:`;
  const tag = (tags ?? []).find((t) => t.toLowerCase().startsWith(prefix));
  if (!tag) return null;
  const value = tag
    .slice(prefix.length)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  return value || null;
}

/**
 * Product type / tags -> mapping. Optional tags set the listing's
 * starting look: "color:NAVY", "material:SATIN" (use the codes from
 * your color_master / material_master).
 */
function readTypeMapping(shopifyProduct) {
  const labels = [shopifyProduct?.productType, ...(shopifyProduct?.tags ?? [])]
    .filter(Boolean)
    .map(singular);

  const match = GARMENT_TYPE_PRODUCT_CODES.find((entry) =>
    entry.keywords.some((keyword) => labels.includes(keyword))
  );
  if (!match) return null;

  const tags = shopifyProduct?.tags ?? [];
  return {
    productCode: match.productCode,
    defaultMaterialCode: readTagValue(tags, "material"),
    defaultColorCode: readTagValue(tags, "color") ?? readTagValue(tags, "colour"),
  };
}

/**
 * Resolves whether a Shopify product has a live Supabase configurator
 * behind it, and any default material/color override for this
 * particular listing.
 *
 * Priority order: the shopify_product_mapping table (admin-page
 * managed — a targeted override) first, then the product's own
 * Shopify metafields, then Product type / tags (the easiest path for
 * bulk uploads), then the hardcoded fallback.
 *
 * @param {object} shopifyProduct - result of getShopifyProductByHandle (must include .metafields)
 * @returns {Promise<{productCode: string, defaultMaterialCode: string|null, defaultColorCode: string|null} | null>}
 */
export async function getConfiguratorMapping(shopifyProduct) {
  try {
    const dbMapping = await getActiveMappingForShopifyProduct(shopifyProduct.id);
    if (dbMapping) {
      return {
        productCode: dbMapping.product_code,
        defaultMaterialCode: dbMapping.default_material_code,
        defaultColorCode: dbMapping.default_color_code,
      };
    }
  } catch (err) {
    console.error("DB mapping lookup failed, trying metafields:", err.message);
  }

  const metafieldMapping = readMetafieldMapping(shopifyProduct);
  if (metafieldMapping) {
    return metafieldMapping.isActive ? metafieldMapping : null;
  }

  const typeMapping = readTypeMapping(shopifyProduct);
  if (typeMapping) {
    return typeMapping;
  }

  const fallbackCode = FALLBACK_MAPPING[shopifyProduct.id];
  return fallbackCode
    ? { productCode: fallbackCode, defaultMaterialCode: null, defaultColorCode: null }
    : null;
}

const PRODUCT_CARD_FIELDS = /* GraphQL */ `
  id
  handle
  title
  tags
  productType
  featuredImage {
    url
    altText
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  options(first: 5) {
    name
    optionValues {
      name
    }
  }
`;

export async function getShopifyProducts(first = 20) {
  const data = await shopifyStorefront(
    `query ProductList($first: Int!) {
      products(first: $first) {
        nodes {
          ${PRODUCT_CARD_FIELDS}
        }
      }
    }`,
    { first }
  );

  return data.products.nodes;
}

export async function getShopifyProductByHandle(handle) {
  const data = await shopifyStorefront(
    `query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        tags
        productType
        descriptionHtml
        images(first: 8) {
          nodes {
            url
            altText
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
        metafields(identifiers: [${METAFIELD_IDENTIFIERS}]) {
          key
          value
        }
      }
    }`,
    { handle }
  );

  return data.product;
}
