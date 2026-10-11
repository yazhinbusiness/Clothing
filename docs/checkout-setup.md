# Checkout setup (Shopify Draft Orders + Supabase login)

## How it works
Cart "Checkout" -> must be signed in -> `POST /api/checkout` re-reads the bag
from Supabase (frozen prices; nothing about money comes from the browser) ->
creates a Shopify **Draft Order** in INR with one custom line per bag line and
the customisation as line properties -> customer pays on Shopify's page ->
`/orders` asks Shopify "is it paid?" and records the order (`checkout_sessions`).

Prices in Supabase are treated as the **final GST-inclusive price**. The app
splits them (5% up to Rs 2,500 per piece before tax, 18% above) for the cart,
the order record and the Shopify order note. Shipping is free.
To restore margin later, raise the markup in Supabase (e.g. cost x 1.37 instead
of x 1.3); no code change is needed.

## 1. `.env.local` (restart `npm run dev` after editing)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # NEW. Supabase > Project Settings > API > service_role. Server only. Never commit.

SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=...
SHOPIFY_ADMIN_DOMAIN=yourstore.myshopify.com   # optional, defaults to SHOPIFY_STORE_DOMAIN
SHOPIFY_CLIENT_ID=...                # Dev Dashboard app > Settings
SHOPIFY_CLIENT_SECRET=...
NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=false          # set true once Google is enabled in Supabase
```

## 2. Supabase
1. SQL editor: run `sql/checkout.sql`.
2. Authentication > Providers: Email enabled. Turn **off** "Confirm email" if you
   want sign-in with a code only.
3. Login mode (`NEXT_PUBLIC_LOGIN_MODE` in `.env.local`):
   - `link` (default): emails a sign-in link using Supabase's default template.
     No SMTP needed. Open the link in the same browser.
   - `code`: emails a 6-digit code. Needs custom SMTP first (Supabase locks the
     template otherwise), then put `{{ .Token }}` in the Magic Link template.
4. Authentication > URL Configuration: Site URL `http://localhost:3000` and add
   `http://localhost:3000/**` under Redirect URLs (add your real domain later).
5. Supabase's built-in email sender is limited to a few emails per hour. Fine for
   testing; before launch add a custom SMTP sender (Resend/Brevo free tiers work).

## 3. Shopify (dev store)
- Settings > Taxes and duties > India: collect GST, **tax-inclusive prices ON**,
  default rate 5%. Draft-order lines are marked taxable, so Shopify shows
  "includes GST". (When pants/kurti above Rs 2,500 arrive, add an 18% override.)
- Settings > Shipping: nothing needed; the draft order carries a free shipping line.
- Payments: Test payment gateway (card number 1 = success, 2 = declined, 3 = failure;
  any future date, any 3-digit CVV).

## 4. First test order
1. `npm run dev`, add a configured shirt to the bag, open `/cart`.
2. The summary should read: Price before GST / GST (5%) / Shipping Free / Total.
3. Click **Sign in to Checkout** -> enter email -> open the emailed link (or enter the code in `code` mode) -> back on `/cart`.
4. Click **Proceed to Checkout** -> Shopify payment page (INR, line properties visible).
5. Enter a shipping address, pay with card number `1`.
6. Open `/orders`: the order should show **Paid**, and the bag should be empty.
7. In Shopify admin > Orders: the order with the custom lines and the GST note.
8. Repeat with card `2` (declined) -> `/orders` should keep it as "Payment pending".

## Known limits (v1)
- Orders are recorded when the customer opens `/orders` (no webhook yet). Add an
  `orders/paid` webhook before launch so orders are captured even if they never return.
- Draft-order payment pages must be checked with your real Indian gateway
  (Razorpay etc.) on a paid plan.
- Stock/fulfilment emails come from Shopify; our own confirmation email is not built yet.
