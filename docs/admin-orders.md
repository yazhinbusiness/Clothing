# Admin: orders and remakes

Page: `/admin/orders` (not linked from the shop). Print sheet: `/admin/orders/<id>/print`.

## Setup (once)
1. **Run `sql/admin_orders.sql` in the Supabase SQL editor - before you deploy.** The customer Orders page now reads the new columns, so it would show an error without it. Safe to re-run.
2. Add to `.env.local` and to your host (Vercel) env: `ADMIN_EMAILS=you@example.com` (comma separated for more than one). Restart the dev server.
3. Sign in on the shop with that email (same login as customers), then open `/admin/orders`. Any other account gets "Not an admin account".
4. Customer name / phone / address come from the Shopify order. If the Shopify app lacks the `read_orders` permission (and, for live stores, access to protected customer data), the address area says so and links to the order in Shopify instead. Everything else works without it.

## Orders tab
- Tabs: New, Stitching, Shipped, Delivered, All, with counts; search by order number, email or product.
- Open an order to see: customer and address, every garment (style, neck, sleeve, material, colour, size or "made to measure" measurements), price and GST split, and your cost and profit per line.
- Progress buttons: New > Stitching > Shipped > Delivered (you can also step back).
  - **Shipped** needs a courier and tracking number.
  - **Delivered** sets the delivery date, which starts the customer's 15-day free-remake window. Moving back from Delivered clears it.
- Private notes are never shown to the customer. Customers see the stage and tracking on their Orders page.
- "Print tailor sheet" opens a one-page sheet (spec and measurements, no prices).

## Remakes tab
- Each request shows original vs new measurements and the change in cm.
- Flow: Requested > Approved > In stitching > Shipped, or Rejected. Rejecting needs a reason; the customer sees it. Shipped needs courier and tracking.
- A note you type is shown to the customer next to the status on their Orders page.

## Security notes
- All admin data goes through `/api/admin/*`, which checks the signed-in user's email against `ADMIN_EMAILS` on the server. The service-role key is only used there.
- Customers can read only their own order and remake rows (row-level security); only the server writes the new columns.
