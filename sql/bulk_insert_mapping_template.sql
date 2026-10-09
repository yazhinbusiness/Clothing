-- BULK MAPPING TEMPLATE
-- Run this in the Supabase SQL editor AFTER you've bulk-uploaded a
-- batch of products to Shopify and created the matching garments in
-- Supabase. One row per product. Duplicate the VALUES line as many
-- times as you need — do NOT run shopify_product_mapping.sql again,
-- that only needs to run once ever (it creates the table).
--
-- WHERE TO FIND EACH VALUE:
--
-- shopify_product_id   The product's Shopify GID, formatted exactly as
--                       'gid://shopify/Product/1234567890'. Find the
--                       numeric ID in the Shopify admin URL when
--                       viewing the product — the number after
--                       /products/ in the URL bar. Or query it:
--                       look at the "Existing mappings" list on
--                       /admin/shopify-mappings after adding one
--                       product manually to see the exact format.
--
-- shopify_product_title Just for your own reference in the admin list
--                       — use the exact Shopify product title.
--
-- product_code          Must already exist in product_master. If this
--                       is a genuinely new garment construction (not
--                       just a new color/fabric of an existing one),
--                       build that out in Supabase FIRST (garment,
--                       sizes, materials, colors, options, pricing) —
--                       this table only links to a product_code, it
--                       doesn't create one.
--
-- default_material_code /
-- default_color_code    Optional. Leave as NULL to use whatever
--                       product_material_map / product_color_map
--                       already marks is_default for that product_code.
--                       Set one of these when this specific Shopify
--                       listing should default to a different
--                       material/color than the shared product_code's
--                       own default (e.g. product_code SHIRT_BASE used
--                       by both "White Cotton Shirt" (default WHITE)
--                       and "Blue Cotton Shirt" (default_color_code
--                       set to 'BLUE')).
--
-- is_active             true shows "Customize" on the storefront;
--                       false shows "Customization coming soon" —
--                       useful if you want to link the product ahead
--                       of time but the garment data isn't ready yet.

insert into public.shopify_product_mapping
  (shopify_product_id, shopify_product_title, product_code, default_material_code, default_color_code, is_active)
values
  ('gid://shopify/Product/REPLACE_ME_1', 'REPLACE_ME title 1', 'REPLACE_ME_PRODUCT_CODE', null, null, true),
  ('gid://shopify/Product/REPLACE_ME_2', 'REPLACE_ME title 2', 'REPLACE_ME_PRODUCT_CODE', null, 'BLUE', true),
  ('gid://shopify/Product/REPLACE_ME_3', 'REPLACE_ME title 3', 'REPLACE_ME_PRODUCT_CODE', null, null, false)
on conflict (shopify_product_id) do update set
  shopify_product_title = excluded.shopify_product_title,
  product_code = excluded.product_code,
  default_material_code = excluded.default_material_code,
  default_color_code = excluded.default_color_code,
  is_active = excluded.is_active,
  updated_at = now();
