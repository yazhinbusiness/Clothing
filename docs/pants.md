# Pants

Pants are a second garment next to shirts. They use the same customizer page,
size / My size flow, cart and checkout.

## What customers can choose

| Option | Choices | Default | Changes the picture? |
|---|---|---|---|
| Fit | Straight, Skinny, Contoured, Wide leg, Flared, Pegged, Boot cut, Palazzo, High waist | Straight | **Yes** (one full image per fit) |
| Waistband | Regular, Elastic with drawstrings, Seamless | Regular | No (price only) |
| Drawstring | Yes / No | No | No |
| Belt loops | Yes / No | Yes | No |
| Pockets | Yes / No | Yes | No |
| Length | Full / Ankle | Full | No |
| Colour | Black, Blue, Grey | Black | Yes (tint) |
| Fabric | Cotton only | Cotton | - |

## Setup (once)

1. Copy the project files over, including the 9 images in `public/assets/pants_*.webp`.
2. Supabase -> SQL editor -> run `sql/pants.sql`. It is safe to run again.
   Check it worked (two separate queries):
   ```sql
   select public.create_default_product_configuration('COTTON_PANTS', 'M') as id;
   ```
   Copy the id it returns, then:
   ```sql
   select selling_price, total_fabric_meters from public.product_configuration
   where id = 'PASTE-THE-ID-HERE';
   ```
   You should see a price (about 1387 with the placeholder costs). This leaves one
   harmless draft row behind. (Running both in one query shows "Configuration ... was
   not found", because a query cannot see a row it creates itself.)
3. Shopify admin -> Products -> Add product:
   - Title: `Cotton Pants` (any title works; photos are shown before Customize)
   - **Product type: `Pants`** (this is what links it to the pants customizer)
   - Tags and metafields are NOT needed. Product type alone links it; the starting look is Straight / Black / Cotton.
     (Optional later: tags `color:Blue` or `fit:Wide Leg` change a listing's starting look.)
   - Price: anything (the site always shows the Supabase price)
   - Untick "Track quantity" (made to order)
   - Sales channels: same ones your shirts use
   To list several starting fits, duplicate the product and change the `fit:` tag
   (Straight, Skinny, Contoured, Wide Leg, Flared, Pegged, Boot Cut, Palazzo, High Waist).
4. Restart `npm run dev` and open the product.

## Prices (placeholders - change later)

Everything is a normal table in Supabase. Edit rows, nothing else changes.

| What | Table |
|---|---|
| Pants cotton price per metre (shirt cotton is separate) | `garment_material_price` |
| Fabric per size (metres) | `garment_size_fabric_consumption` (garment PANTS) |
| Stitching / packing / shipping | `garment_base_cost` (garment PANTS) |
| Remake allowance, payment fee | `garment_cost_rule` (garment PANTS) |
| Profit (fixed floor + additional) | `garment_profit_rule` (garment PANTS) |
| Cost of each option | `option_fixed_cost` |
| Extra fabric of each option | `option_fabric_consumption` |

Placeholder values: cotton Rs 350/m, fabric 1.00-1.50 m by size, stitching 350,
packing 40, shipping 80, remake 3%, payment fee 2.5%, fixed profit 15%,
additional profit 25% (the first-order My size discount comes out of the
additional profit, so keep it at about 18% of the selling price or more for the
full 15% off).

## Notes

- Pants reuse the shirt price columns in the saved price: `pocket_fabric_meters`
  = fabric of all selected options, `collar_cost` = cost of all selected options.
- My size works for pants. The standard size used for pricing is still picked from
  chest, waist and hip.
