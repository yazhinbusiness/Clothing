# Kurti

Kurti is the third garment. Same customizer page, size / My size flow, cart and checkout.

## What customers can choose

| Option | Choices | Default | Changes the picture? |
|---|---|---|---|
| Style | Straight, A-line, Anarkali, Empire line, Flared high-low, Front slit, High-low, Open slit | Straight | **Yes** (body layer) |
| Neck | Bow, Classic, Double, Mandarin, Notched, Peter Pan, Round, Sailor, V-neck | Classic | **Yes** (neck layer) |
| Sleeve | Bell, Bishop, Cap, Flared, Full, Half, No sleeve, Petal, Puff, 3/4 | Half | **Yes** (sleeve layer) |
| Pockets | Yes / No | Yes | No (price only) |
| Knot at back | Yes / No | Yes | No (price only) |
| Knot at hip | Yes / No | Yes | No (price only) |
| Zipper | Yes / No | No | No (price only) |
| Fabric | Cotton, Satin | Cotton | - |
| Colour | Same colours as the shirt | shirt default | Yes (tint) |

Raglan sleeve is not offered on kurtis.

## Setup (once)

1. Copy the project files over, including the 27 images `public/assets/kurti_*.webp`.
2. `sql/pants.sql` must already have been run (it is, for you). Supabase -> SQL editor -> run `sql/kurti.sql`. Safe to run again.
   Check (two separate queries):
   ```sql
   select public.create_default_product_configuration('COTTON_KURTI', 'M') as id;
   ```
   then
   ```sql
   select selling_price, total_fabric_meters from public.product_configuration
   where id = 'PASTE-THE-ID-HERE';
   ```
   Expect about 2588.66 and 3.020 with the placeholder costs.
3. Shopify admin -> Products -> Add product:
   - Title: e.g. `Cotton Kurti`
   - **Product type: `Kurti`** (exactly; "Short Kurti" will not match)
   - No tags or metafields needed. Optional tags: `style:A-line`, `neck:V`, `sleeve:Full`, `color:Black`.
   - Price anything; untick "Track quantity"; same sales channels as shirts.
4. Restart `npm run dev` and open the product.

## Prices (placeholders - change later)

| What | Table |
|---|---|
| Kurti fabric price per metre (Cotton 320, Satin 520) | `garment_material_price` |
| Fabric per size (2.30 m XS ... 3.30 m 6XL, M = 2.60) | `garment_size_fabric_consumption` (garment KURTI) |
| Stitching 550 / packing 50 / shipping 90 | `garment_base_cost` |
| Remake 3%, payment fee 2.5% | `garment_cost_rule` |
| Profit 15% fixed + 25% additional | `garment_profit_rule` |
| Cost of each option | `option_fixed_cost` |
| Extra fabric of each option | `option_fabric_consumption` |

Pricing = (size fabric + fabric of every selected option) x fabric price + option costs + stitching/packing/shipping, then the cascading rules, same as pants.
