const KEY = "ohmust_cart_titles";

// The cart RPC returns the generic garment name from the product master
// (the same for every shirt). The customer should see the Shopify listing
// title instead, and checkout needs the Shopify variant so the line shows the
// product photo. We remember both per cart line in this browser.
// Display only; neither ever affects the price.
export function readCartTitles() {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

// Entries are { title, variantId }; older entries were plain strings.
export function cartTitleOf(entry) {
  if (!entry) return null;
  return typeof entry === "string" ? entry : entry.title ?? null;
}

export function rememberCartTitle(cartItemId, title, variantId = null) {
  if (!cartItemId || !title) return;
  try {
    const all = readCartTitles();
    all[cartItemId] = { title: String(title).slice(0, 120), variantId: variantId || null };
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}
