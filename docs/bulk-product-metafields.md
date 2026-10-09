# Bulk-creating products with configurator metafields

This is the fast path for creating many Shopify products at once, each
already wired to the right Supabase configurator and default
material/color — no separate GID lookup or SQL step needed afterward.

## Important: this doesn't create garment data

Metafields only tell the storefront **which existing Supabase
product_code** to use for a Shopify listing (and what default
material/color that listing should start on). They don't create a new
garment construction. If you're bulk-adding 100 *colorways/fabrics of
a construction you've already built out in Supabase* (sizes,
materials, colors, options, pricing all exist for that product_code),
you're in the right place. If some of those 100 are genuinely new
garment shapes, build those out in Supabase first — this only wires
the UI to data that already exists.

## Two prices, two jobs

- **Shopify's own Price field** (set per product/variant in the CSV)
  is only what shows on the plain photo view, before anyone taps
  Customize — a "starting from" figure for browsing.
- **The actual price charged** is always computed live from Supabase
  (`get_default_product_price`, by product_code + size) once someone
  customizes. Shopify's price never overrides this. Set Shopify's
  price to whatever the Supabase default-size price is, just so the
  browse view isn't misleading — but know it's cosmetic.

## Step 1 — Create the metafield definitions (once)

In Shopify Admin: **Settings → Custom data → Products → Add
definition**. Create these four:

| Name (yours to choose) | Type | Namespace.key (Shopify assigns this) |
|---|---|---|
| Configurator product code | Single line text | `custom.product_code` |
| Default material override | Single line text | `custom.default_material_code` |
| Default color override | Single line text | `custom.default_color_code` |
| Configurator active | True or false | `custom.is_active` |

**Critical step easy to miss:** for each definition, open its settings
and enable **"Storefront API"** access (there's a checkbox/toggle for
this). Without it, the storefront's Storefront API query — which is
how this app reads them — will silently get nothing back even though
the values are set and visible in the Shopify admin.

If Shopify assigns a namespace other than `custom` (it usually
doesn't, but double check what's shown after creating the first
definition), update the one constant in
`lib/shopify/catalog.js`:

```js
const METAFIELD_NAMESPACE = "custom";
```

## Step 2 — Get the CSV template

Shopify Admin → **Products → Export** → export your current products
(or just a sample) as CSV. Once the definitions from Step 1 exist,
the exported CSV will include four new columns:

```
Product Metafield: custom.product_code [single_line_text_field]
Product Metafield: custom.default_material_code [single_line_text_field]
Product Metafield: custom.default_color_code [single_line_text_field]
Product Metafield: custom.is_active [boolean]
```

Use this exported file as your starting template rather than typing
column headers from scratch — the exact header format (including the
`[type]` suffix) has to match what Shopify expects on import.

## Step 3 — Fill in your 100 rows

Besides the usual Title/Price/Images/etc. columns, fill the four
metafield columns per product:

- **product_code** — must be an existing code in Supabase's
  `product_master` table. Multiple Shopify products can share the same
  code (e.g. 20 colorways all using `SHIRT_BASE`).
- **default_material_code** / **default_color_code** — optional,
  leave blank to use that product_code's own DB default. Fill these in
  when this specific listing should default to a different
  material/color than the shared construction's default (this is the
  main thing that makes 100 listings from a handful of constructions
  make sense).
- **is_active** — `TRUE` to show "Customize" on the storefront, `FALSE`
  to show "Customization coming soon" (useful if you want the listing
  live before its garment data is fully ready).

## Step 4 — Import

Shopify Admin → **Products → Import** → upload your filled CSV. For
100 rows this runs as a background job; Shopify emails you when it's
done, along with any row-level errors.

## Overriding a specific product later without touching Shopify

The `/admin/shopify-mappings` page (and its underlying
`shopify_product_mapping` table) still works exactly as before, and
takes priority over metafields — use it for a quick one-off fix
without re-exporting/re-importing a CSV. Metafields are the bulk
default; the admin table is the scalpel.
