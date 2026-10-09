-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Supersedes the flat product_color_map for availability purposes:
-- product_color_map has no idea which material a color belongs to, so
-- every color was shown regardless of the selected material. This adds
-- a proper product+material -> color junction table and an RPC scoped
-- to (product_code, material_code), which the app now calls instead of
-- the old get_product_colors.
--
-- The old product_color_map rows (if you ran add_shirt_colors_materials.sql
-- before this) are harmless leftovers — just unused by the new code path.

-- ---------- MATERIALS (idempotent — in case add_shirt_colors_materials.sql hasn't run) ----------
insert into material_master (material_code, material_name, unit)
select v.material_code, v.material_name, 'meter'
from (values
  ('LINEN', 'Linen'),
  ('SATIN', 'Satin')
) as v(material_code, material_name)
where not exists (
  select 1 from material_master mm where mm.material_code = v.material_code
);

insert into product_material_map (product_id, material_id, is_default, is_active)
select p.id, mm.id, false, true
from product_master p
cross join material_master mm
where p.product_code = 'WHITE_COTTON_SHIRT'
  and mm.material_code in ('LINEN', 'SATIN')
  and not exists (
    select 1 from product_material_map pmm
    where pmm.product_id = p.id and pmm.material_id = mm.id
  );

-- ---------- NEW TABLE ----------
create table if not exists public.product_material_color_map (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.product_master (id),
  material_id uuid not null references public.material_master (id),
  color_id uuid not null references public.color_master (id),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, material_id, color_id)
);

-- ---------- RPC ----------
-- Mirrors get_product_colors' return shape, scoped to one material.
create or replace function public.get_product_colors_for_material(
  p_product_code text,
  p_material_code text
)
returns table (
  color_code text,
  color_name text,
  is_default boolean
)
language sql
stable
as $$
  select cm.color_code, cm.color_name, pmcm.is_default
  from public.product_material_color_map pmcm
  join public.product_master p on p.id = pmcm.product_id
  join public.material_master m on m.id = pmcm.material_id
  join public.color_master cm on cm.id = pmcm.color_id
  where p.product_code = p_product_code
    and m.material_code = p_material_code
    and pmcm.is_active = true
    and cm.is_active = true
  order by cm.color_name;
$$;

-- ---------- ALL NEW COLOR CODES (superset across cotton/satin/linen) ----------
-- Idempotent — only inserts codes not already present (some may already
-- exist if add_shirt_colors_materials.sql ran first).
insert into color_master (color_code, color_name)
select v.color_code, v.color_name
from (values
  ('NAVY',            'Navy Blue'),
  ('CHARCOAL',        'Charcoal Grey'),
  ('SKY_BLUE',        'Sky Blue'),
  ('BEIGE',           'Beige'),
  ('SAGE',            'Sage Green'),
  ('BURGUNDY',        'Burgundy'),
  ('BLUSH_PINK',      'Blush Pink'),
  ('LAVENDER',        'Lavender'),
  ('PALE_PINK',       'Pale Pink'),
  ('PALE_YELLOW',     'Pale Yellow'),
  ('EMERALD',         'Emerald Green'),
  ('SAPPHIRE',        'Sapphire Blue'),
  ('CHAMPAGNE_GOLD',  'Champagne Gold'),
  ('ROYAL_PURPLE',    'Royal Purple'),
  ('CRIMSON',         'Crimson'),
  ('DEEP_NAVY',       'Deep Navy'),
  ('TERRACOTTA',      'Terracotta'),
  ('OATMEAL',         'Oatmeal'),
  ('TAUPE',           'Taupe'),
  ('STONE_GREY',      'Stone Grey'),
  ('CHOCOLATE_BROWN', 'Chocolate Brown')
) as v(color_code, color_name)
where not exists (
  select 1 from color_master cm where cm.color_code = v.color_code
);

-- ---------- SCOPE EACH PALETTE TO ITS MATERIAL ----------
-- WHITE_COTTON_SHIRT x COTTON
insert into product_material_color_map (product_id, material_id, color_id, is_default, is_active)
select p.id, m.id, cm.id, (cm.color_code = 'WHITE'), true
from product_master p
join material_master m on m.material_code = 'COTTON'
cross join color_master cm
where p.product_code = 'WHITE_COTTON_SHIRT'
  and cm.color_code in (
    'WHITE', 'BLACK', 'SKY_BLUE', 'PALE_PINK', 'NAVY',
    'CHARCOAL', 'PALE_YELLOW', 'LAVENDER', 'BURGUNDY', 'SAGE'
  )
on conflict (product_id, material_id, color_id) do nothing;

-- WHITE_COTTON_SHIRT x LINEN
insert into product_material_color_map (product_id, material_id, color_id, is_default, is_active)
select p.id, m.id, cm.id, (cm.color_code = 'BEIGE'), true
from product_master p
join material_master m on m.material_code = 'LINEN'
cross join color_master cm
where p.product_code = 'WHITE_COTTON_SHIRT'
  and cm.color_code in (
    'WHITE', 'BLACK', 'BEIGE', 'SAGE', 'TERRACOTTA',
    'OATMEAL', 'TAUPE', 'STONE_GREY', 'CHOCOLATE_BROWN'
  )
on conflict (product_id, material_id, color_id) do nothing;

-- WHITE_COTTON_SHIRT x SATIN
insert into product_material_color_map (product_id, material_id, color_id, is_default, is_active)
select p.id, m.id, cm.id, (cm.color_code = 'BLACK'), true
from product_master p
join material_master m on m.material_code = 'SATIN'
cross join color_master cm
where p.product_code = 'WHITE_COTTON_SHIRT'
  and cm.color_code in (
    'WHITE', 'BLACK', 'EMERALD', 'SAPPHIRE', 'BURGUNDY',
    'CHAMPAGNE_GOLD', 'BLUSH_PINK', 'ROYAL_PURPLE', 'CRIMSON', 'DEEP_NAVY'
  )
on conflict (product_id, material_id, color_id) do nothing;
