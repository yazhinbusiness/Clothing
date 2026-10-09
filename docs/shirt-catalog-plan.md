# Shirt module — master assets & 25-product catalog plan

## Master image inventory (per construction element, NOT per color)

Because the customizer tints grayscale layers with CSS blend modes,
you never need a separate asset per color — only per distinct
**shape**. "None" option values need no asset at all (nothing is
rendered).

| Group | Values | Distinct assets needed |
|---|---|---|
| Fit | Regular, Fit, Loose | **3** (these change the overall body silhouette, so each is its own base body layer, not an overlay) |
| Collar | Classic, Bow, Sailor, Notched, Peter Pan, Mandarin | **6** |
| Placket | Full, Half, Full Closed, *None* | **3** (None = no asset) |
| Pocket | *None*, Left, Right, Both | **2** (Left and Right are the only real assets — "Both" just renders both layers together, "None" renders neither) |
| Sleeve | Full, Half, 3/4, Puff, Bishop, Bell, Petal, Raglan, *No Sleeve* | **8** (No Sleeve = no asset) |

**Total: 22 master grayscale layers per material.**

### The material question

Cotton and Satin genuinely drape and reflect light differently — true
photographic fidelity would mean **22 × 2 = 44** assets (a separate
set per fabric). The cheaper, still-credible path: keep **one set of
22** grayscale layers and simulate satin's sheen at render time with a
CSS treatment (a soft highlight gradient / increased blend-mode
luminosity layered on top of the same shape) rather than separate
artwork. Given you're pre-launch, I'd start with the shared-asset
approach and only split into true per-material art later if customers
specifically call out that satin doesn't read as satin.

Either way: **color is free** — all 17 colors across both fabrics
(10 cotton + 7 satin) ride on these same 22 (or 44) shapes via tint,
not new photography.

## The 25 products

Each row is a **hero listing** — one curated starting combination with
its own Shopify product (title, photo, hero color/material via the
`default_color_code`/`default_material_code` metafields). The customer
can still change fit, collar, sleeve, pocket, placket, material and
color freely once they land on any of these — the hero combo is just
the marketing entry point, not a restriction. Pocket defaults to None
and Placket to Full unless noted, keeping the base silhouette clean;
Fit is "Fit" (tailored) by default since that's the most corporate
silhouette.

| # | Product Name | Collar | Sleeve | Material | Hero Color | Notes |
|---|---|---|---|---|---|---|
| 1 | Classic Oxford Shirt | Classic | Full | Cotton | White | Core, safest entry product |
| 2 | Classic Half-Sleeve Shirt | Classic | Half | Cotton | Sky Blue → use Navy* | Everyday desk shirt |
| 3 | Classic Breeze Shirt | Classic | 3/4 | Cotton | Grey | Transitional-weather piece |
| 4 | Classic Raglan Shirt | Classic | Raglan | Cotton | Olive Green | Softer shoulder line, casual-Friday |
| 5 | Classic Sleeveless Shell | Classic | No Sleeve | Satin | White | Layer-under-blazer piece |
| 6 | Notched Blazer-Collar Shirt | Notched | Full | Cotton | Navy | Sharpest, most "board meeting" piece |
| 7 | Notched Half-Sleeve Shirt | Notched | Half | Cotton | Grey | |
| 8 | Notched Breeze Shirt | Notched | 3/4 | Cotton | Brown | Warm-neutral option |
| 9 | Notched Bishop Shirt | Notched | Bishop | Satin | Midnight | Elevated evening-meeting piece |
| 10 | Mandarin Signature Shirt | Mandarin | Full | Cotton | White | Ties directly to your brand identity |
| 11 | Mandarin Half-Sleeve Shirt | Mandarin | Half | Cotton | Maroon | |
| 12 | Mandarin Breeze Shirt | Mandarin | 3/4 | Cotton | Aqua | Fresher, younger-professional option |
| 13 | Mandarin Bell Shirt | Mandarin | Bell | Satin | Burgundy | Statement sleeve, structured collar balances it |
| 14 | Peter Pan Puff Shirt | Peter Pan | Puff | Cotton | Peach | Softest, most playful piece in the line |
| 15 | Peter Pan Petal Shirt | Peter Pan | Petal | Cotton | Lavender | |
| 16 | Peter Pan Half-Sleeve Shirt | Peter Pan | Half | Cotton | White | More restrained version for conservative offices |
| 17 | Peter Pan Bell Shirt | Peter Pan | Bell | Satin | Rose | |
| 18 | Sailor Full-Sleeve Shirt | Sailor | Full | Cotton | Navy | Classic nautical-preppy pairing |
| 19 | Sailor Half-Sleeve Shirt | Sailor | Half | Cotton | White | |
| 20 | Sailor Puff Shirt | Sailor | Puff | Satin | Grey | |
| 21 | Sailor Bishop Shirt | Sailor | Bishop | Satin | Golden | Standout piece, pairs with brand's gold accent |
| 22 | Bow-Tie Collar Shirt | Bow | Full | Satin | Black | Most formal/event-adjacent piece |
| 23 | Bow Half-Sleeve Shirt | Bow | Half | Cotton | Black | More everyday-wearable bow version |
| 24 | Bow Petal Shirt | Bow | Petal | Satin | Rose | |
| 25 | Bow Bishop Shirt | Bow | Bishop | Cotton | Maroon | |

\* Sky Blue isn't in the authoritative Cotton list you gave me (Navy
is) — swapped to Navy for row 2; flagging in case Sky Blue was meant
to still be included.

### Reasoning behind the spread

- **Classic, Notched, Mandarin** (15 of 25) lean corporate — these
  carry the brand's core "boardroom" identity and get the most real
  estate, plus most of the plain/structured sleeves (Full, Half, 3/4).
- **Peter Pan, Sailor, Bow** (10 of 25) lean softer/more
  fashion-forward — these absorb nearly all the statement sleeves
  (Puff, Bishop, Bell, Petal), since a decorative collar plus a plain
  sleeve reads unbalanced, and a plain collar plus a dramatic sleeve
  does too.
- Satin is reserved for 7 of the 25 — all in the softer/formal
  collars, matching the research from earlier (satin suits richer,
  more elevated looks, not everyday desk wear).
- Every cotton color appears somewhere except none are totally
  unused; same for satin's 7.

This is a starting proposal, not a fixed catalog — tell me if you want
more/fewer corporate vs. elevated pieces, or a different balance
across collars.
