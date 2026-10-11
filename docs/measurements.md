# My size, first-order discount and free remake

## Set up (once)
1. Supabase SQL editor: run `sql/measurements.sql` (safe to re-run).
2. Copy the changed files, restart `npm run dev`.

## How it works
- Product page: **Standard size | My size**. My size needs a sign-in. Saved profiles
  (several per customer) can be picked, edited or added in the pop-up. Three entry
  modes: full form, step by step (picture), step by step (video).
- Every measurement is stored in mm. Chest, waist and hip are required (they decide the
  pricing size); the Trousers group is optional until pants launch.
- The order gets its own frozen COPY of the profile, so editing a profile later never
  changes an order.
- First My size order: 15% off, never below the protected price floor. Calculated in
  the database (`commit_configuration_price`). The percentage lives in
  `custom_first_order_percent()`.
- Used once per customer: recorded when the order is PAID (`custom_first_order_used`).
- Free remake: first My size order only, request within 15 days of delivery, each
  measurement within +/- 2 cm of the order. You mark delivery yourself:
  `update checkout_sessions set delivered_at = now() where shopify_order_name = '#1001';`
  Requests appear in `remake_requests`.

## Videos and pictures
All measurements use one placeholder video. Replace per measurement:
`update measurement_type_master set video_url = 'https://...' where measurement_code = 'CHEST';`
The step-by-step picture is a generic placeholder drawing for now.
