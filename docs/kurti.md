# Kurti

Each kurti style has its **own** neck and sleeve pictures, so the customizer shows the
neck and sleeve that belong to the chosen style.

## What customers can choose

| Section | Choices | Default |
|---|---|---|
| Style | Straight, A-line, Anarkali, Angrakha, Empire cut, High-low, Kaftan, Shirt kurti | Straight |
| Neck | Boat, Classic collar, Mandarin collar, Notched collar, Peter Pan collar, Round, Scallop square, Scallop V, Square, Sweetheart, V-neck | Classic collar |
| Sleeve | Bell, Bishop, Cap, Full, Half, No sleeve, Petal, Puff | Half |
| Pockets / Knot at back / Knot at hip | Yes / No (price only) | Yes |
| Zipper | Yes / No (price only) | No |
| Fabric | Cotton, Satin | Cotton |
| Colour | Same as the shirt | shirt default |

Only choices that have a picture for the chosen style are shown. Examples: **Kaftan has no
Sleeve section** (sleeves are part of its picture), **Angrakha** has no Boat or Scallop V neck,
**Shirt kurti** has 4 fewer necks. When you change the style, a neck or sleeve that does not
exist for it moves to the first one that does (Kaftan sets Sleeve to "No sleeve", which costs nothing).

## Setup (once)

1. Copy the project files over (images are `public/assets/kurti2_*.webp`, 202 files).
   You can **delete the old `public/assets/kurti_*.webp`** files (27 files, no longer used).
2. Supabase -> SQL editor -> run `sql/kurti_v2.sql` (after `pants.sql` and `kurti.sql`; safe to re-run).
   It replaces the old styles / necks / sleeves and pictures; existing kurti prices are kept.
3. Check the price (two separate queries):
   ```sql
   select public.create_default_product_configuration('COTTON_KURTI', 'M') as id;
   ```
   ```sql
   select selling_price, total_fabric_meters from public.product_configuration where id = 'PASTE-THE-ID-HERE';
   ```
   Expect about 2588.66 and 3.020.
4. Shopify product type stays `Kurti`. Optional tags: `style:Kaftan`, `neck:Round`, `sleeve:Full`, `color:Black`.
5. Restart `npm run dev`, hard refresh.

## How the per-style pictures work (for later)

A picture's `asset_code` ends in `@<STYLE>` (e.g. `KURTI2_NECK_NECK_ROUND@KURTI_A_LINE`).
The customizer draws it only for that style, and offers a neck/sleeve only if it has a picture for the
selected style. A new style = add the style value, its body picture and its tagged neck/sleeve
pictures (see `sql/kurti_v2.sql`).

## Colour

All kurti pictures are neutral grey (no colour cast) with the same brightness, so any colour tint looks
the same on every style, neck and sleeve. New pictures get the same treatment before they go in.

## Prices (placeholders)

Same tables as before: `garment_material_price` (Cotton 320 / Satin 520), `garment_size_fabric_consumption`,
`garment_base_cost`, `garment_cost_rule`, `garment_profit_rule`, `option_fixed_cost`, `option_fabric_consumption`
(garment KURTI). New values from this update (Angrakha, Kaftan, Shirt kurti, Boat, Classic collar ... Sweetheart)
have placeholder costs.
