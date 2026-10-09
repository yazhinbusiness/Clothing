# Adding Shopify products so they're customizable

A Shopify product becomes a *customizable* page when the app can work out
which Supabase garment (`product_code`) powers it. Checked in this order:

1. `shopify_product_mapping` table row (admin page: /admin/shopify-mappings)
2. Shopify metafields: `custom.product_code` (+ optional defaults)
3. **Product type / tags** (easiest — use this for bulk uploads)
4. Hardcoded fallback

## Easiest path (no database work)

In Shopify (or the product CSV):

| Field | Value |
|---|---|
| Type | `Shirt` |
| Tags | `shirt, new, color:NAVY, material:COTTON, fit:Regular, sleeve:Full` |

- `Type = Shirt` -> gets the Shirt customizer, and lands in the Shirts tab.
- `color:` / `material:` -> the listing's starting look. Use the codes from
  color_master / material_master (NAVY, OLIVE, GREY ... COTTON, SATIN).
- `fit:` / `sleeve:` / `material:` / `color:` also drive the shop filters and
  the "Cotton · Regular Fit · Full Sleeve" line on cards.
- Tag `new` / `bestseller` shows a badge on the card.

Shopify's own Price is only a cosmetic "from" price — the real price always
comes from Supabase once someone customizes.

## Adding Pants / Kurti / Short Kurti later
Build the garment in Supabase (product_master row + its maps), then add one
line to GARMENT_TYPE_PRODUCT_CODES in lib/shopify/catalog.js.
