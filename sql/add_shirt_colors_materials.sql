-- Run in the Supabase SQL editor. Safe to re-run — every insert is
-- guarded so it only adds what's missing.
--
-- Adds 8 new colors (on top of existing White/Black) and the two
-- missing materials (Linen, Satin — Cotton presumably already
-- exists given the product is named WHITE_COTTON_SHIRT) to the shirt
-- construction, so the storefront's color/material pickers have real
-- options to show and the "default_color_code" / "default_material_code"
-- metafield overrides have something to point at.
--
-- Hex values for these colors live in lib/colorMap.js (color_master
-- has no hex column — color rendering is entirely a frontend concern).

-- ---------- COLORS ----------
insert into color_master (color_code, color_name)
select v.color_code, v.color_name
from (values
  ('NAVY',        'Navy Blue'),
  ('CHARCOAL',    'Charcoal Grey'),
  ('SKY_BLUE',    'Sky Blue'),
  ('BEIGE',       'Beige'),
  ('SAGE',        'Sage Green'),
  ('BURGUNDY',    'Burgundy'),
  ('BLUSH_PINK',  'Blush Pink'),
  ('LAVENDER',    'Lavender')
) as v(color_code, color_name)
where not exists (
  select 1 from color_master cm where cm.color_code = v.color_code
);

insert into product_color_map (product_id, color_id, is_default, is_active)
select p.id, cm.id, false, true
from product_master p
cross join color_master cm
where p.product_code = 'WHITE_COTTON_SHIRT'
  and cm.color_code in (
    'NAVY', 'CHARCOAL', 'SKY_BLUE', 'BEIGE',
    'SAGE', 'BURGUNDY', 'BLUSH_PINK', 'LAVENDER'
  )
  and not exists (
    select 1 from product_color_map pcm
    where pcm.product_id = p.id and pcm.color_id = cm.id
  );

-- ---------- MATERIALS ----------
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
