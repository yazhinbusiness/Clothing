# Short Kurti

Each short kurti style has its **own** neck and sleeve pictures (same idea as the Kurti).
Same options and fabric (Cotton, Satin) as the Kurti; its own pictures and its own prices.

## What customers can choose

| Section | Choices | Default |
|---|---|---|
| Style | Straight, A-line, Empire line, Empire cut, Angrakha, Flared, Front slit, High-low, Peplum, Shirt style | Straight |
| Neck | Boat, Classic collar, Keyhole, Mandarin collar, Notched collar, Peter Pan collar, Round, Scallop square, Scallop V, Square, Sweetheart, V-neck | Round |
| Sleeve | Bell, Bishop, Cap, Flared, Full, Half, No sleeve, Petal, Puff | Half |
| Pockets / Knot at back / Knot at hip | Yes / No (price only) | Yes |
| Zipper | Yes / No (price only) | No |

Only choices with a picture for the chosen style are shown:
- **Angrakha** has no neck pictures (the neckline is part of the body), so it has no Neck section.
- **Shirt style** has only Classic, Mandarin, Notched and Peter Pan collars (all 9 sleeves are available).
- **Empire cut** has 7 necks, **Flared** 10, **High-low** has 11 necks and no Bell or Full sleeve.

## Setup (once)

1. Copy the project files over (images are `public/assets/short_kurti2_*.webp`, 269 files).
   You can **delete the old `public/assets/short_kurti_*.webp`** files (44 files, no longer used).
2. Supabase -> SQL editor -> run `sql/short_kurti_v2.sql` (after `short_kurti.sql`; safe to re-run).
   Existing prices are kept. Check, as two separate queries:
   ```sql
   select public.create_default_product_configuration('COTTON_SHORT_KURTI', 'M') as id;
   ```
   ```sql
   select selling_price, total_fabric_meters from public.product_configuration where id = 'PASTE-THE-ID-HERE';
   ```
   Expect about 2016.06 and 2.200.
3. Shopify product type stays `Short Kurti`. Restart `npm run dev`, hard refresh.

## Colour

All pictures are neutral grey with equal brightness, so a colour looks the same on every style, neck and sleeve.
Per-style pictures use `@<STYLE>` at the end of the asset_code (see docs/kurti.md).

## Prices (placeholders)

`garment_material_price` (Cotton 320 / Satin 520), `garment_size_fabric_consumption`, `garment_base_cost`,
`garment_cost_rule`, `garment_profit_rule`, `option_fixed_cost`, `option_fabric_consumption` (garment SHORT_KURTI).
