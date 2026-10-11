-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- One row per checkout attempt. It doubles as the order record:
--   PENDING  = Shopify draft order created, customer hasn't paid yet
--   PAID     = Shopify says the order is paid (set by /api/orders/sync)
--   CANCELLED/EXPIRED = not used yet, reserved
-- Only the server (service-role key) writes here. Customers can only READ
-- their own rows.

create table if not exists public.checkout_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id),
  email                text,
  guest_cart_id        text not null,
  status               text not null default 'PENDING'
                         check (status in ('PENDING','PAID','CANCELLED','EXPIRED')),
  items_hash           text not null,
  items                jsonb not null,            -- frozen copy of the cart lines
  items_total_inr      numeric(12,2) not null,    -- GST-inclusive
  taxable_inr          numeric(12,2) not null,
  gst_inr              numeric(12,2) not null,
  shipping_inr         numeric(12,2) not null default 0,
  total_inr            numeric(12,2) not null,
  shopify_draft_order_id   text,
  shopify_draft_order_name text,
  invoice_url          text,
  shopify_order_id     text,
  shopify_order_name   text,
  created_at           timestamptz not null default now(),
  paid_at              timestamptz
);

create index if not exists checkout_sessions_user_idx
  on public.checkout_sessions (user_id, created_at desc);
create index if not exists checkout_sessions_pending_idx
  on public.checkout_sessions (status) where status = 'PENDING';

alter table public.checkout_sessions enable row level security;

drop policy if exists "own checkout sessions are readable" on public.checkout_sessions;
create policy "own checkout sessions are readable"
  on public.checkout_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- no insert/update/delete policies on purpose: only the service role can write.
