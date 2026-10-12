# Short Kurti

Fourth garment. Same options as the Kurti, with its own pictures and its own prices.

## What customers can choose

| Option | Choices | Default | Picture? |
|---|---|---|---|
| Style | Straight, A-line, Empire line, Anarkali, High-low, Empire A-line, Flared, Front slit, Peplum, Shirt style | Straight | Yes (body) |
| Neck | Bow, Double, Heart, Keyhole, Mandarin, Notched, Peter Pan, Round, Sailor, Scallop, Square, V-neck | Round | Yes |
| Sleeve | Bell, Cap, Flared, Full, Half, Large bishop, Small bishop, No sleeve, Petal, Puff, 3/4 | Half | Yes (left + right pictures) |
| Pockets / Knot at back / Knot at hip | Yes / No | Yes | No (price only) |
| Zipper | Yes / No | No | No (price only) |
| Fabric | Cotton, Satin | Cotton | - |
| Colour | Same as the shirt | shirt default | Yes (tint) |

Not offered: a **Classic** neck (no such image in the short set). Note: the Anarkali and Flared pictures look almost identical - send a different Anarkali if you want them to differ.

## Setup (once)

1. Copy the project files over, including the 44 images `public/assets/short_kurti_*.webp`.
2. `sql/pants.sql` and `sql/kurti.sql` must already have been run. Then run `sql/short_kurti.sql` in the Supabase SQL editor (safe to run again). Check, as two separate queries:
   ```sql
   select public.create_default_product_configuration('COTTON_SHORT_KURTI', 'M') as id;
   ```
   ```sql
   select selling_price, total_fabric_meters from public.product_configuration where id = 'PASTE-THE-ID-HERE';
   ```
   Expect about 2016.06 and 2.200.
3. Shopify -> Add product, **Product type: `Short Kurti`** (exactly), untick "Track quantity". Optional tags: `style:Peplum`, `neck:Heart`, `sleeve:Full`, `color:Black`.
4. Restart `npm run dev`.

## Prices (placeholders)

Cotton 320 / Satin 520 per metre (own price for this garment), fabric 1.60 m (2XS) to 2.50 m (6XL), M = 1.80; stitching 450, packing 50, shipping 80; remake 3%, payment fee 2.5%; profit 15% + 25%. Option costs and fabric: tables `option_fixed_cost` and `option_fabric_consumption` (garment SHORT_KURTI), same tables as the other garments.

## Pictures

Kurti and Short Kurti pictures are portrait (3:4) and cropped tight so the garment fills the frame. The preview adapts to the picture shape automatically; shirts and pants stay square. To replace a picture later, send the new images and I re-crop them together (all layers of one garment must share one crop so they line up).
