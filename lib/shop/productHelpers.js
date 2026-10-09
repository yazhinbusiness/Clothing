import { getColorHex } from "@/lib/colorMap";

/**
 * Shop categories. A product belongs to one based on its Shopify
 * "Product type" (or a tag) — so bulk uploads only need Type = Shirt /
 * Pants / Kurti / Short Kurti to land in the right tab.
 */
export const CATEGORIES = [
  { code: "SHIRTS", label: "Shirts", blurb: "Classic or Bold. It's Your Call.", sub: "Timeless shirts, reimagined with your choice of details." },
  { code: "PANTS", label: "Pants", blurb: "Cut to Your Measure.", sub: "Tailored pants, made to sit exactly right." },
  { code: "KURTIS", label: "Kurtis", blurb: "Tradition, Tailored.", sub: "Kurtis made to your silhouette and style." },
  { code: "SHORT_KURTIS", label: "Short Kurtis", blurb: "Short on Length. Long on Style.", sub: "Short kurtis, designed your way." },
];

export function formatPrice(amount, currencyCode) {
  const value = Number(amount);
  if (currencyCode === "INR") return `₹${value.toLocaleString("en-IN")}`;
  return `${currencyCode} ${value.toLocaleString()}`;
}

export function toColorCode(name) {
  return String(name).toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function swatchHex(name) {
  return getColorHex(toColorCode(name));
}

function normalize(value) {
  const v = String(value ?? "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .trim();
  return v.endsWith("s") ? v.slice(0, -1) : v;
}

/** Values of tags written "key:value", e.g. material:Cotton -> ["Cotton"]. */
export function tagValues(product, key) {
  const prefix = `${key}:`;
  return (product.tags ?? [])
    .filter((t) => t.toLowerCase().startsWith(prefix))
    .map((t) => t.slice(prefix.length).trim())
    .filter(Boolean);
}

export function productCategory(product) {
  const labels = [product.productType, ...(product.tags ?? [])]
    .filter(Boolean)
    .map(normalize);

  if (labels.includes("short kurti")) return "SHORT_KURTIS";
  if (labels.includes("kurti")) return "KURTIS";
  if (labels.includes("pant") || labels.includes("trouser")) return "PANTS";
  if (labels.includes("shirt")) return "SHIRTS";
  return null;
}

/** Color names from the Shopify "Color" option and/or color:xxx tags. */
export function productColorNames(product) {
  const option = (product.options ?? []).find(
    (o) => o.name?.toLowerCase() === "color" || o.name?.toLowerCase() === "colour"
  );
  const fromOption = option?.optionValues?.map((v) => v.name) ?? [];
  const fromTags = [...tagValues(product, "color"), ...tagValues(product, "colour")];
  return Array.from(new Set([...fromOption, ...fromTags]));
}

export function productBadge(product) {
  const tags = (product.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes("bestseller")) return "BESTSELLER";
  if (tags.includes("new")) return "NEW";
  return null;
}

/** "Cotton · Regular Fit · Bell Sleeve" from material:/fit:/sleeve: tags. */
export function productMeta(product) {
  const parts = [];
  const material = tagValues(product, "material")[0];
  const fit = tagValues(product, "fit")[0];
  const sleeve = tagValues(product, "sleeve")[0];
  if (material) parts.push(material);
  if (fit) parts.push(`${fit} Fit`);
  if (sleeve) parts.push(`${sleeve} Sleeve`);
  return parts.length ? parts.join(" · ") : "Made to order";
}
