-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Supersedes product_material_color_map.sql's guessed palettes with
-- the authoritative spec:
--   Cotton: White, Black, Olive Green, Lavender, Peach, Brown, Maroon,
--           Navy, Aqua, Grey
--   Satin:  White, Black, Burgundy, Rose, Golden, Midnight, Grey
-- Linen is dropped from the material lineup entirely (deactivated,
-- not deleted — easy to bring back later if needed).

-- ---------- DROP LINEN ----------
update product_material_map pmm
set is_active = false
from product_master p, material_master m
where pmm.product_id = p.id
  and pmm.material_id = m.id
  and p.product_code = 'WHITE_COTTON_SHIRT'
  and m.material_code = 'LINEN';

-- ---------- NEW COLOR CODES THIS SPEC NEEDS ----------
insert into color_master (color_code, color_name)
select v.color_code, v.color_name
from (values
  ('OLIVE',   'Olive Green'),
  ('PEACH',   'Peach'),
  ('BROWN',   'Brown'),
  ('MAROON',  'Maroon'),
  ('AQUA',    'Aqua'),
  ('GREY',    'Grey'),
  ('ROSE',    'Rose'),
  ('GOLDEN',  'Golden'),
  ('MIDNIGHT','Midnight')
) as v(color_code, color_name)
where not exists (
  select 1 from color_master cm where cm.color_code = v.color_code
);

-- ---------- DEACTIVATE THE OLD (GUESSED) COTTON PALETTE ----------
update product_material_color_map pmcm
set is_active = false
from product_master p, material_master m, color_master cm
where pmcm.product_id = p.id
  and pmcm.material_id = m.id
  and pmcm.color_id = cm.id
  and p.product_code = 'WHITE_COTTON_SHIRT'
  and m.material_code = 'COTTON'
  and cm.color_code in (
    'SKY_BLUE', 'PALE_PINK', 'CHARCOAL', 'PALE_YELLOW', 'BURGUNDY', 'SAGE'
  );

-- ---------- DEACTIVATE THE OLD (GUESSED) SATIN PALETTE ----------
update product_material_color_map pmcm
set is_active = false
from product_master p, material_master m, color_master cm
where pmcm.product_id = p.id
  and pmcm.material_id = m.id
  and pmcm.color_id = cm.id
  and p.product_code = 'WHITE_COTTON_SHIRT'
  and m.material_code = 'SATIN'
  and cm.color_code in (
    'EMERALD', 'SAPPHIRE', 'CHAMPAGNE_GOLD', 'BLUSH_PINK',
    'ROYAL_PURPLE', 'CRIMSON', 'DEEP_NAVY'
  );

-- ---------- INSERT THE CORRECT COTTON PALETTE ----------
insert into product_material_color_map (product_id, material_id, color_id, is_default, is_active)
select p.id, m.id, cm.id, (cm.color_code = 'WHITE'), true
from product_master p
join material_master m on m.material_code = 'COTTON'
cross join color_master cm
where p.product_code = 'WHITE_COTTON_SHIRT'
  and cm.color_code in (
    'WHITE', 'BLACK', 'OLIVE', 'LAVENDER', 'PEACH',
    'BROWN', 'MAROON', 'NAVY', 'AQUA', 'GREY'
  )
on conflict (product_id, material_id, color_id)
  do update set is_active = true, is_default = excluded.is_default;

-- ---------- INSERT THE CORRECT SATIN PALETTE ----------
insert into product_material_color_map (product_id, material_id, color_id, is_default, is_active)
select p.id, m.id, cm.id, (cm.color_code = 'WHITE'), true
from product_master p
join material_master m on m.material_code = 'SATIN'
cross join color_master cm
where p.product_code = 'WHITE_COTTON_SHIRT'
  and cm.color_code in (
    'WHITE', 'BLACK', 'BURGUNDY', 'ROSE', 'GOLDEN', 'MIDNIGHT', 'GREY'
  )
on conflict (product_id, material_id, color_id)
  do update set is_active = true, is_default = excluded.is_default;
