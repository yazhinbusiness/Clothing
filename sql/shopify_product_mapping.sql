-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor).
--
-- Lets a new Shopify product be linked to an existing Supabase
-- product_code (garment construction), with optional default
-- material/color overrides — e.g. two different Shopify listings
-- ("White Cotton Shirt", "Blue Cotton Shirt") can both point at the
-- same product_code but default to different colors.
--
-- SECURITY NOTE: this project has no admin auth system yet (per the
-- architecture doc, RLS hardening is a pre-launch task across several
-- tables). This table follows the same current posture — permissive
-- for now via the anon key, gated only by the admin page's lightweight
-- passcode check, NOT real security. Tighten this (proper RLS + real
-- auth) before production launch, same as the other flagged tables.

create table if not exists public.shopify_product_mapping (
  id uuid primary key default gen_random_uuid(),
  shopify_product_id text not null unique,
  shopify_product_title text,
  product_code text not null references public.product_master (product_code),
  default_material_code text,
  default_color_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_shopify_mapping_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_shopify_product_mapping_updated_at
  on public.shopify_product_mapping;

create trigger trg_shopify_product_mapping_updated_at
before update on public.shopify_product_mapping
for each row execute function public.set_shopify_mapping_updated_at();

-- Seed the one mapping that already exists in code, so the DB becomes
-- the single source of truth going forward.
insert into public.shopify_product_mapping
  (shopify_product_id, shopify_product_title, product_code)
values
  ('gid://shopify/Product/10774429860134', 'White Cotton Shirt', 'WHITE_COTTON_SHIRT')
on conflict (shopify_product_id) do nothing;

alter table public.shopify_product_mapping enable row level security;

-- Permissive for now (see security note above) — revisit before launch.
drop policy if exists "Allow all for now" on public.shopify_product_mapping;
create policy "Allow all for now"
  on public.shopify_product_mapping
  for all
  using (true)
  with check (true);
