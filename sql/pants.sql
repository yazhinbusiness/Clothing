-- =============================================================
-- PANTS  (run once in the Supabase SQL editor; safe to re-run)
--
-- Adds a second garment, PANTS, next to SHIRT:
--   * options  Fit (9 fits), Waistband, Drawstring, Belt loops, Pockets, Length
--   * the picture changes ONLY with Fit (one full pants image per fit)
--   * material Cotton, colours Black / Blue / Grey
--   * ALL COSTS BELOW ARE PLACEHOLDERS - edit them in the tables named in
--     each section (garment_*, option_*, garment_material_price).
--
-- How pants are priced (same shape as shirts):
--   fabric  = size fabric + fabric of every selected option
--   cost    = fabric x pants cotton price + option costs + stitching/packing/shipping
--   then the same overhead / remake / payment-fee / profit rules as shirts.
-- In the saved price snapshot the shirt-named columns are reused:
--   pocket_fabric_meters = fabric used by all selected options
--   collar_cost          = fixed cost of all selected options
--   sleeve_fabric_meters and placket_cost are 0 for pants.
-- =============================================================

-- ---------- 1. pants-only cotton price (shirts keep material_price) ----------
create table if not exists public.garment_material_price (
  id uuid primary key default gen_random_uuid(),
  price_book_id uuid not null references public.price_book_master(id),
  garment_id uuid not null references public.garment_master(id),
  material_id uuid not null references public.material_master(id),
  price_per_meter numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (price_book_id, garment_id, material_id)
);
alter table public.garment_material_price enable row level security;

-- Sections 2-9 run as ONE block: the Supabase SQL editor can run each statement in a
-- separate session, which would lose the temporary tables used below.
do $$
declare
  v_g uuid;
  v_pb uuid;
begin
  -- ---------- 2. garment ----------
  insert into public.garment_master (garment_code, garment_type, is_active)
  select 'PANTS', 'Pants', true
  where not exists (select 1 from public.garment_master where garment_code = 'PANTS');

  -- ---------- 3. option groups (Fit already exists, shared with shirts) ----------
  insert into public.option_group_master (option_group_code, option_group_name, is_active, sort_order)
  select v.code, v.name, true, v.ord
  from (values
    ('WAISTBAND',    'Waistband',  60),
    ('DRAWSTRING',   'Drawstring', 61),
    ('BELT_LOOPS',   'Belt loops', 62),
    ('PANT_POCKETS', 'Pockets',    63),
    ('LENGTH',       'Length',     64)
  ) as v(code, name, ord)
  where not exists (select 1 from public.option_group_master g where g.option_group_code = v.code);

  -- ---------- 4. option values ----------
  -- value codes are unique across groups on purpose (the price manifest looks
  -- values up by code alone).
  drop table if exists pg_temp._pv;
  create temporary table _pv (grp text, code text, name text, ord int, is_default boolean);
  insert into _pv values
    ('FIT','STRAIGHT',   'Straight',   10, true),
    ('FIT','SKINNY',     'Skinny',     11, false),
    ('FIT','CONTOURED',  'Contoured',  12, false),
    ('FIT','WIDE_LEG',   'Wide leg',   13, false),
    ('FIT','FLARED',     'Flared',     14, false),
    ('FIT','PEGGED',     'Pegged',     15, false),
    ('FIT','BOOT_CUT',   'Boot cut',   16, false),
    ('FIT','PALAZZO',    'Palazzo',    17, false),
    ('FIT','HIGH_WAIST', 'High waist', 18, false),
    ('WAISTBAND','REGULAR_WAISTBAND',        'Regular',                 1, true),
    ('WAISTBAND','ELASTIC_WITH_DRAWSTRINGS', 'Elastic with drawstrings',2, false),
    ('WAISTBAND','SEAMLESS_WAISTBAND',       'Seamless',                3, false),
    ('DRAWSTRING','WITH_DRAWSTRING', 'Yes', 1, false),
    ('DRAWSTRING','NO_DRAWSTRING',   'No',  2, true),
    ('BELT_LOOPS','WITH_BELT_LOOPS', 'Yes', 1, true),
    ('BELT_LOOPS','NO_BELT_LOOPS',   'No',  2, false),
    ('PANT_POCKETS','WITH_POCKETS',  'Yes', 1, true),
    ('PANT_POCKETS','NO_POCKETS',    'No',  2, false),
    ('LENGTH','FULL_LENGTH',  'Full',  1, true),
    ('LENGTH','ANKLE_LENGTH', 'Ankle', 2, false);

  insert into public.option_value_master (option_group_id, option_value_code, option_value_name, is_active, sort_order)
  select g.id, v.code, v.name, true, v.ord
  from _pv v join public.option_group_master g on g.option_group_code = v.grp
  where not exists (
    select 1 from public.option_value_master x where x.option_group_id = g.id and x.option_value_code = v.code);

  -- ---------- 5. which groups / values PANTS offers ----------
  insert into public.garment_option_group_map (garment_id, option_group_id, is_required, is_active, sort_order)
  select (select id from public.garment_master where garment_code='PANTS'), g.id, true, true, v.ord
  from (values ('FIT',1),('WAISTBAND',2),('DRAWSTRING',3),('BELT_LOOPS',4),('PANT_POCKETS',5),('LENGTH',6)) v(code, ord)
  join public.option_group_master g on g.option_group_code = v.code
  where not exists (
    select 1 from public.garment_option_group_map m
    where m.garment_id = (select id from public.garment_master where garment_code='PANTS') and m.option_group_id = g.id);

  insert into public.garment_option_value_map (garment_id, option_value_id, is_active, sort_order)
  select (select id from public.garment_master where garment_code='PANTS'), ov.id, true, v.ord
  from _pv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where not exists (
    select 1 from public.garment_option_value_map m
    where m.garment_id = (select id from public.garment_master where garment_code='PANTS') and m.option_value_id = ov.id);

  -- ---------- 6. pictures: one image per fit ----------
  insert into public.asset_set_master (garment_id, asset_set_code, asset_set_name, version_number, is_active)
  select (select id from public.garment_master where garment_code='PANTS'),
         'PANTS_FRONT_V1', 'Pants Front Customizer V1', 1, true
  where not exists (select 1 from public.asset_set_master where asset_set_code = 'PANTS_FRONT_V1');

  drop table if exists pg_temp._pa;
  create temporary table _pa (fit text, file text);
  insert into _pa values
    ('STRAIGHT','pants_straight.webp'),('SKINNY','pants_skinny.webp'),('CONTOURED','pants_contoured.webp'),
    ('WIDE_LEG','pants_wide_leg.webp'),('FLARED','pants_flared.webp'),('PEGGED','pants_pegged.webp'),
    ('BOOT_CUT','pants_boot_cut.webp'),('PALAZZO','pants_palazzo.webp'),('HIGH_WAIST','pants_high_waist.webp');

  insert into public.customizer_asset
    (asset_set_id, asset_code, asset_name, asset_group, asset_side, file_key, width, height, z_index, is_active, is_base_asset)
  select (select id from public.asset_set_master where asset_set_code='PANTS_FRONT_V1'),
         'PANTS_' || a.fit, 'Pants - ' || a.fit, 'BODY', 'CENTER', 'pants/v1/body/' || a.file,
         1024, 1024, 1, true, false
  from _pa a
  where not exists (select 1 from public.customizer_asset c where c.asset_code = 'PANTS_' || a.fit);

  insert into public.option_value_asset_map (asset_set_id, option_value_id, customizer_asset_id, is_active, sort_order)
  select (select id from public.asset_set_master where asset_set_code='PANTS_FRONT_V1'), ov.id, ca.id, true, 1
  from _pa a
  join public.option_group_master g on g.option_group_code = 'FIT'
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = a.fit
  join public.customizer_asset ca on ca.asset_code = 'PANTS_' || a.fit
  where not exists (
    select 1 from public.option_value_asset_map m
    where m.option_value_id = ov.id and m.customizer_asset_id = ca.id);

  -- ---------- 7. colours ----------
  insert into public.color_master (color_code, color_name, hex_code, is_active)
  select 'BLUE', 'Blue', '#2b4c9b', true
  where not exists (select 1 from public.color_master where color_code = 'BLUE');

  -- ---------- 8. the product ----------
  insert into public.product_master (garment_id, product_code, product_name, is_customizable, is_active)
  select (select id from public.garment_master where garment_code='PANTS'), 'COTTON_PANTS', 'Cotton Pants', true, true
  where not exists (select 1 from public.product_master where product_code = 'COTTON_PANTS');

  insert into public.product_size_map (product_id, size_id, is_active, sort_order)
  select (select id from public.product_master where product_code='COTTON_PANTS'), s.id, true, s.size_order
  from public.size_master s
  where s.is_active = true
    and not exists (select 1 from public.product_size_map m
                    where m.product_id = (select id from public.product_master where product_code='COTTON_PANTS')
                      and m.size_id = s.id);

  insert into public.product_material_map (product_id, material_id, is_default, is_active, sort_order)
  select (select id from public.product_master where product_code='COTTON_PANTS'), m.id, true, true, 1
  from public.material_master m
  where m.material_code = 'COTTON'
    and not exists (select 1 from public.product_material_map x
                    where x.product_id = (select id from public.product_master where product_code='COTTON_PANTS')
                      and x.material_id = m.id);

  insert into public.product_color_map (product_id, color_id, is_default, is_active, sort_order)
  select (select id from public.product_master where product_code='COTTON_PANTS'), c.id, (c.color_code='BLACK'), true,
         case c.color_code when 'BLACK' then 1 when 'BLUE' then 2 else 3 end
  from public.color_master c
  where c.color_code in ('BLACK','BLUE','GREY')
    and not exists (select 1 from public.product_color_map x
                    where x.product_id = (select id from public.product_master where product_code='COTTON_PANTS')
                      and x.color_id = c.id);

  insert into public.product_material_color_map (product_id, material_id, color_id, is_default, is_active)
  select (select id from public.product_master where product_code='COTTON_PANTS'), m.id, c.id, (c.color_code='BLACK'), true
  from public.material_master m, public.color_master c
  where m.material_code = 'COTTON' and c.color_code in ('BLACK','BLUE','GREY')
    and not exists (select 1 from public.product_material_color_map x
                    where x.product_id = (select id from public.product_master where product_code='COTTON_PANTS')
                      and x.material_id = m.id and x.color_id = c.id);

  -- starting options (defaults): Straight, Regular waistband, no drawstring,
  -- belt loops yes, pockets yes, full length
  insert into public.product_option_value_map (product_id, option_group_id, option_value_id, is_default, is_active)
  select (select id from public.product_master where product_code='COTTON_PANTS'), g.id, ov.id, v.is_default, true
  from _pv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where not exists (select 1 from public.product_option_value_map x
                    where x.product_id = (select id from public.product_master where product_code='COTTON_PANTS')
                      and x.option_value_id = ov.id);

  v_g := (select id from public.garment_master where garment_code = 'PANTS');
  v_pb := (select id from public.price_book_master where price_book_code = 'PB_2026_01');

  -- ---------- 9. PLACEHOLDER COSTS (edit these later) ----------
  -- pants cotton price per metre (shirt cotton price is untouched)
  insert into public.garment_material_price (price_book_id, garment_id, material_id, price_per_meter)
  select v_pb, v_g, m.id, 350
  from public.material_master m
  where m.material_code = 'COTTON'
  on conflict (price_book_id, garment_id, material_id) do nothing;

  -- fabric per size (metres)
  insert into public.garment_size_fabric_consumption (garment_id, size_id, fabric_meters, is_active)
  select v_g, s.id,
         case s.size_code when '2XS' then 1.00 when 'XS' then 1.05 when 'S' then 1.10 when 'M' then 1.15
           when 'L' then 1.20 when 'XL' then 1.25 when '2XL' then 1.30 when '3XL' then 1.35
           when '4XL' then 1.40 when '5XL' then 1.45 else 1.50 end, true
  from public.size_master s
  where not exists (select 1 from public.garment_size_fabric_consumption x where x.garment_id = v_g and x.size_id = s.id);

  -- base costs
  insert into public.garment_base_cost (price_book_id, garment_id, cost_code, cost_name, fixed_cost, is_active)
  select v_pb, v_g, c.code, c.name, c.amount, true
  from (values ('STITCHING','Stitching',350),('PACKING','Packing',40),('SHIPPING','Shipping',80)) c(code, name, amount)
  where not exists (select 1 from public.garment_base_cost x where x.price_book_id = v_pb and x.garment_id = v_g and x.cost_code = c.code);

  -- cost rules (same shape as shirts)
  insert into public.garment_cost_rule (price_book_id, garment_id, cost_code, cost_name, cost_type, cost_value, is_active)
  select v_pb, v_g, c.code, c.name, c.ctype, c.val, true
  from (values ('OTHER_OVERHEAD','Other overhead','FIXED',0),
               ('REMAKE_ALLOWANCE','Remake allowance','PERCENT',3),
               ('PAYMENT_FEE','Payment fee','PERCENT',2.5)) c(code, name, ctype, val)
  where not exists (select 1 from public.garment_cost_rule x where x.price_book_id = v_pb and x.garment_id = v_g and x.cost_code = c.code);

  -- profit: fixed (protected floor) + additional (what the first-order discount can use)
  insert into public.garment_profit_rule
    (price_book_id, garment_id, fixed_profit_type, fixed_profit_value, additional_profit_type, additional_profit_value, is_active)
  select v_pb, v_g, 'PERCENT', 15, 'PERCENT', 25, true
  where not exists (select 1 from public.garment_profit_rule x where x.price_book_id = v_pb and x.garment_id = v_g);

  -- option fixed cost (Rs) and extra fabric (metres, cannot be negative), by option value
  drop table if exists pg_temp._po;
  create temporary table _po (code text, cost numeric, fabric numeric);
  insert into _po values
    ('STRAIGHT',0,0),('SKINNY',20,0),('CONTOURED',30,0),('WIDE_LEG',30,0.25),('FLARED',40,0.25),
    ('PEGGED',30,0),('BOOT_CUT',30,0.10),('PALAZZO',50,0.40),('HIGH_WAIST',40,0.05),
    ('REGULAR_WAISTBAND',0,0),('ELASTIC_WITH_DRAWSTRINGS',40,0.03),('SEAMLESS_WAISTBAND',60,0.02),
    ('WITH_DRAWSTRING',20,0.02),('NO_DRAWSTRING',0,0),
    ('WITH_BELT_LOOPS',15,0.01),('NO_BELT_LOOPS',0,0),
    ('WITH_POCKETS',30,0.05),('NO_POCKETS',0,0),
    ('FULL_LENGTH',0,0),('ANKLE_LENGTH',0,0);

  insert into public.option_fixed_cost (price_book_id, garment_id, option_value_id, fixed_cost)
  select v_pb, v_g, ov.id, p.cost
  from _po p join public.option_value_master ov on ov.option_value_code = p.code
  where not exists (select 1 from public.option_fixed_cost x
                    where x.price_book_id = v_pb and x.garment_id = v_g and x.option_value_id = ov.id);

  insert into public.option_fabric_consumption (garment_id, option_value_id, fabric_meters, is_active)
  select v_g, ov.id, p.fabric, true
  from _po p join public.option_value_master ov on ov.option_value_code = p.code
  where not exists (select 1 from public.option_fabric_consumption x
                    where x.garment_id = v_g and x.option_value_id = ov.id);

  drop table if exists pg_temp._po;

  drop table if exists pg_temp._pv;
  drop table if exists pg_temp._pa;
end $$;

-- ---------- 10. pricing engine: shirts unchanged, pants get their own ----------
-- (a) the old shirt calculation, kept exactly, under a new name
CREATE OR REPLACE FUNCTION public.calculate_shirt_configuration_cost(p_configuration_id uuid)
 RETURNS TABLE(body_fabric_meters numeric, sleeve_fabric_meters numeric, pocket_fabric_meters numeric, total_fabric_meters numeric, material_price_per_meter numeric, fabric_cost numeric, collar_cost numeric, placket_cost numeric, stitching_cost numeric, packing_cost numeric, shipping_cost numeric, base_cost_subtotal numeric, other_overhead_cost numeric, remake_allowance_cost numeric, payment_fee_cost numeric, full_cost numeric, fixed_profit_amount numeric, additional_profit_amount numeric, selling_price numeric, protected_price_floor numeric, max_discount_amount numeric, max_discount_percent numeric)
 LANGUAGE sql
 STABLE
AS $function$

with config_data as (

    select
        pc.id as configuration_id,

        /*
        Use pricing size when custom measurements
        have derived one.

        Otherwise use the customer's selected
        standard size.
        */
        s.size_code,

        m.material_code,
        pb.price_book_code,

        sleeve.option_value_code as sleeve_code,
        pocket.option_value_code as pocket_code,
        collar.option_value_code as collar_code,
        placket.option_value_code as placket_code

    from public.product_configuration pc

    join public.size_master s
        on s.id = coalesce(
            pc.pricing_size_id,
            pc.size_id
        )

    join public.material_master m
        on m.id = pc.material_id

    join public.price_book_master pb
        on pb.id = pc.price_book_id


    /* SLEEVE */

    left join public.option_group_master sleeve_group
        on sleeve_group.option_group_code = 'SLEEVE'

    left join public.product_configuration_option sleeve_selection
        on sleeve_selection.configuration_id = pc.id
       and sleeve_selection.option_group_id = sleeve_group.id

    left join public.option_value_master sleeve
        on sleeve.id = sleeve_selection.option_value_id


    /* POCKET */

    left join public.option_group_master pocket_group
        on pocket_group.option_group_code = 'POCKET'

    left join public.product_configuration_option pocket_selection
        on pocket_selection.configuration_id = pc.id
       and pocket_selection.option_group_id = pocket_group.id

    left join public.option_value_master pocket
        on pocket.id = pocket_selection.option_value_id


    /* COLLAR */

    left join public.option_group_master collar_group
        on collar_group.option_group_code = 'COLLAR'

    left join public.product_configuration_option collar_selection
        on collar_selection.configuration_id = pc.id
       and collar_selection.option_group_id = collar_group.id

    left join public.option_value_master collar
        on collar.id = collar_selection.option_value_id


    /* PLACKET */

    left join public.option_group_master placket_group
        on placket_group.option_group_code = 'PLACKET'

    left join public.product_configuration_option placket_selection
        on placket_selection.configuration_id = pc.id
       and placket_selection.option_group_id = placket_group.id

    left join public.option_value_master placket
        on placket.id = placket_selection.option_value_id


    where pc.id = p_configuration_id
)

select *
from public.calculate_shirt_cost(
    (select size_code from config_data),
    (select material_code from config_data),
    (select sleeve_code from config_data),
    (select pocket_code from config_data),
    (select collar_code from config_data),
    (select placket_code from config_data),
    (select price_book_code from config_data)
);

$function$;

-- (b) pants calculation. Returns the same columns as the shirt one.
create or replace function public.calculate_pants_configuration_cost(p_configuration_id uuid)
returns table(body_fabric_meters numeric, sleeve_fabric_meters numeric, pocket_fabric_meters numeric, total_fabric_meters numeric, material_price_per_meter numeric, fabric_cost numeric, collar_cost numeric, placket_cost numeric, stitching_cost numeric, packing_cost numeric, shipping_cost numeric, base_cost_subtotal numeric, other_overhead_cost numeric, remake_allowance_cost numeric, payment_fee_cost numeric, full_cost numeric, fixed_profit_amount numeric, additional_profit_amount numeric, selling_price numeric, protected_price_floor numeric, max_discount_amount numeric, max_discount_percent numeric)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_garment uuid;
  v_pb uuid;
  v_size uuid;
  v_material uuid;
  v_body numeric;
  v_opt_fabric numeric;
  v_opt_cost numeric;
  v_price numeric;
  v_total numeric;
  v_fabric_cost numeric;
  v_stitch numeric;
  v_pack numeric;
  v_ship numeric;
  v_sub numeric;
  v_oh_t text; v_oh_v numeric; v_oh numeric;
  v_rm_t text; v_rm_v numeric; v_rm numeric;
  v_pf_t text; v_pf_v numeric; v_pf numeric;
  v_full numeric;
  v_fp_t text; v_fp_v numeric; v_ap_t text; v_ap_v numeric;
  v_fp numeric; v_ap numeric; v_floor numeric; v_sell numeric;
begin
  select pm.garment_id, pc.price_book_id, coalesce(pc.pricing_size_id, pc.size_id), pc.material_id
    into v_garment, v_pb, v_size, v_material
  from public.product_configuration pc
  join public.product_master pm on pm.id = pc.product_id
  where pc.id = p_configuration_id;

  if v_garment is null then
    raise exception 'Configuration % was not found', p_configuration_id;
  end if;

  select gsfc.fabric_meters into v_body
  from public.garment_size_fabric_consumption gsfc
  where gsfc.garment_id = v_garment and gsfc.size_id = v_size and gsfc.is_active = true;
  if v_body is null then
    raise exception 'No fabric set for this size';
  end if;

  select coalesce(sum(ofc.fabric_meters), 0) into v_opt_fabric
  from public.product_configuration_option pco
  join public.option_fabric_consumption ofc
    on ofc.option_value_id = pco.option_value_id and ofc.garment_id = v_garment and ofc.is_active = true
  where pco.configuration_id = p_configuration_id;

  select coalesce(sum(ofx.fixed_cost), 0) into v_opt_cost
  from public.product_configuration_option pco
  join public.option_fixed_cost ofx
    on ofx.option_value_id = pco.option_value_id and ofx.garment_id = v_garment and ofx.price_book_id = v_pb
  where pco.configuration_id = p_configuration_id;

  select coalesce(gmp.price_per_meter, mp.price_per_meter) into v_price
  from public.material_price mp
  left join public.garment_material_price gmp
    on gmp.price_book_id = mp.price_book_id and gmp.material_id = mp.material_id and gmp.garment_id = v_garment
  where mp.price_book_id = v_pb and mp.material_id = v_material;
  if v_price is null then
    raise exception 'No price for this material';
  end if;

  v_total := v_body + v_opt_fabric;
  v_fabric_cost := v_total * v_price;

  select coalesce(max(b.fixed_cost) filter (where b.cost_code = 'STITCHING'), 0),
         coalesce(max(b.fixed_cost) filter (where b.cost_code = 'PACKING'), 0),
         coalesce(max(b.fixed_cost) filter (where b.cost_code = 'SHIPPING'), 0)
    into v_stitch, v_pack, v_ship
  from public.garment_base_cost b
  where b.garment_id = v_garment and b.price_book_id = v_pb and b.is_active = true;

  v_sub := v_fabric_cost + v_opt_cost + v_stitch + v_pack + v_ship;

  select coalesce(max(r.cost_type) filter (where r.cost_code = 'OTHER_OVERHEAD'), 'FIXED'),
         coalesce(max(r.cost_value) filter (where r.cost_code = 'OTHER_OVERHEAD'), 0),
         coalesce(max(r.cost_type) filter (where r.cost_code = 'REMAKE_ALLOWANCE'), 'PERCENT'),
         coalesce(max(r.cost_value) filter (where r.cost_code = 'REMAKE_ALLOWANCE'), 0),
         coalesce(max(r.cost_type) filter (where r.cost_code = 'PAYMENT_FEE'), 'PERCENT'),
         coalesce(max(r.cost_value) filter (where r.cost_code = 'PAYMENT_FEE'), 0)
    into v_oh_t, v_oh_v, v_rm_t, v_rm_v, v_pf_t, v_pf_v
  from public.garment_cost_rule r
  where r.garment_id = v_garment and r.price_book_id = v_pb and r.is_active = true;

  v_oh := case when v_oh_t = 'PERCENT' then v_sub * v_oh_v / 100 else v_oh_v end;
  v_rm := case when v_rm_t = 'PERCENT' then (v_sub + v_oh) * v_rm_v / 100 else v_rm_v end;
  v_pf := case when v_pf_t = 'PERCENT' then (v_sub + v_oh + v_rm) * v_pf_v / 100 else v_pf_v end;
  v_full := v_sub + v_oh + v_rm + v_pf;

  select coalesce(p.fixed_profit_type, 'PERCENT'), coalesce(p.fixed_profit_value, 0),
         coalesce(p.additional_profit_type, 'PERCENT'), coalesce(p.additional_profit_value, 0)
    into v_fp_t, v_fp_v, v_ap_t, v_ap_v
  from public.garment_profit_rule p
  where p.garment_id = v_garment and p.price_book_id = v_pb and p.is_active = true
  limit 1;
  v_fp_t := coalesce(v_fp_t, 'PERCENT'); v_fp_v := coalesce(v_fp_v, 0);
  v_ap_t := coalesce(v_ap_t, 'PERCENT'); v_ap_v := coalesce(v_ap_v, 0);

  v_fp := case when v_fp_t = 'PERCENT' then v_full * v_fp_v / 100 else v_fp_v end;
  v_ap := case when v_ap_t = 'PERCENT' then v_full * v_ap_v / 100 else v_ap_v end;
  v_floor := v_full + v_fp;
  v_sell := v_floor + v_ap;

  return query select
    round(v_body, 3), 0::numeric, round(v_opt_fabric, 3), round(v_total, 3),
    round(v_price, 2), round(v_fabric_cost, 2),
    round(v_opt_cost, 2), 0::numeric,
    round(v_stitch, 2), round(v_pack, 2), round(v_ship, 2),
    round(v_sub, 2), round(v_oh, 2), round(v_rm, 2), round(v_pf, 2), round(v_full, 2),
    round(v_fp, 2), round(v_ap, 2), round(v_sell, 2), round(v_floor, 2),
    round(v_ap, 2),
    case when v_sell > 0 then round(v_ap / v_sell * 100, 2) else 0::numeric end;
end;
$function$;

-- (c) everything in the app calls this one; shirts keep their own engine, every other
--     garment (pants, kurti, ...) uses the options-based one above
create or replace function public.calculate_configuration_cost(p_configuration_id uuid)
returns table(body_fabric_meters numeric, sleeve_fabric_meters numeric, pocket_fabric_meters numeric, total_fabric_meters numeric, material_price_per_meter numeric, fabric_cost numeric, collar_cost numeric, placket_cost numeric, stitching_cost numeric, packing_cost numeric, shipping_cost numeric, base_cost_subtotal numeric, other_overhead_cost numeric, remake_allowance_cost numeric, payment_fee_cost numeric, full_cost numeric, fixed_profit_amount numeric, additional_profit_amount numeric, selling_price numeric, protected_price_floor numeric, max_discount_amount numeric, max_discount_percent numeric)
language plpgsql
stable
as $function$
declare
  v_code text;
begin
  select g.garment_code into v_code
  from public.product_configuration pc
  join public.product_master pm on pm.id = pc.product_id
  join public.garment_master g on g.id = pm.garment_id
  where pc.id = p_configuration_id;

  if v_code is not null and v_code <> 'SHIRT' then
    return query select * from public.calculate_pants_configuration_cost(p_configuration_id);
  else
    return query select * from public.calculate_shirt_configuration_cost(p_configuration_id);
  end if;
end;
$function$;

-- ---------- 11. price manifest: use the pants cotton price for pants ----------
create or replace function public.get_pricing_manifest(p_garment_code text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with g as (
    select id from garment_master where garment_code = p_garment_code and is_active = true
  ),
  pb as (
    select id from price_book_master
    where is_active = true
      and effective_from <= now()
      and (effective_to is null or effective_to > now())
    order by effective_from desc
    limit 1
  ),
  base_costs as (
    select cost_code, cost_name, fixed_cost
    from garment_base_cost
    where garment_id = (select id from g) and price_book_id = (select id from pb) and is_active = true
  ),
  cost_rules as (
    select cost_code, cost_name, cost_type, cost_value
    from garment_cost_rule
    where garment_id = (select id from g) and price_book_id = (select id from pb) and is_active = true
  ),
  profit_rule as (
    select fixed_profit_type, fixed_profit_value, additional_profit_type, additional_profit_value
    from garment_profit_rule
    where garment_id = (select id from g) and price_book_id = (select id from pb) and is_active = true
    limit 1
  ),
  option_costs as (
    select ov.option_value_code as value_code, ofc.fixed_cost
    from option_fixed_cost ofc
    join option_value_master ov on ov.id = ofc.option_value_id
    where ofc.garment_id = (select id from g) and ofc.price_book_id = (select id from pb)
  ),
  option_fabric as (
    select ov.option_value_code as value_code, ofab.fabric_meters
    from option_fabric_consumption ofab
    join option_value_master ov on ov.id = ofab.option_value_id
    where ofab.garment_id = (select id from g) and ofab.is_active = true
  ),
  size_fabric as (
    select sm.size_code, gsfc.fabric_meters
    from garment_size_fabric_consumption gsfc
    join size_master sm on sm.id = gsfc.size_id
    where gsfc.garment_id = (select id from g) and gsfc.is_active = true
  ),
  materials as (
    select mm.material_code, coalesce(gmp.price_per_meter, mp.price_per_meter) as price_per_meter
    from material_price mp
    join material_master mm on mm.id = mp.material_id
    left join garment_material_price gmp
      on gmp.price_book_id = mp.price_book_id
     and gmp.material_id = mp.material_id
     and gmp.garment_id = (select id from g)
    where mp.price_book_id = (select id from pb)
  )
  select jsonb_build_object(
    'garmentCode', p_garment_code,
    'priceBookId', (select id from pb),
    'baseCosts', (select coalesce(jsonb_agg(to_jsonb(base_costs)), '[]'::jsonb) from base_costs),
    'costRules', (select coalesce(jsonb_agg(to_jsonb(cost_rules)), '[]'::jsonb) from cost_rules),
    'profitRule', (select to_jsonb(profit_rule) from profit_rule),
    'optionFixedCost', (select coalesce(jsonb_object_agg(value_code, fixed_cost), '{}'::jsonb) from option_costs),
    'optionFabricMeters', (select coalesce(jsonb_object_agg(value_code, fabric_meters), '{}'::jsonb) from option_fabric),
    'sizeFabricMeters', (select coalesce(jsonb_object_agg(size_code, fabric_meters), '{}'::jsonb) from size_fabric),
    'materialPricePerMeter', (select coalesce(jsonb_object_agg(material_code, price_per_meter), '{}'::jsonb) from materials)
  );
$function$;

-- ---------- 12. lets the app ask which garment a product belongs to ----------
create or replace function public.get_product_garment_code(p_product_code text)
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select g.garment_code
  from product_master pm
  join garment_master g on g.id = pm.garment_id
  where pm.product_code = p_product_code
  limit 1;
$function$;

grant execute on function public.get_product_garment_code(text) to anon, authenticated;
grant execute on function public.get_pricing_manifest(text) to anon, authenticated;

-- ---------- check (should return one row per fit-independent price) ----------
-- select * from public.calculate_pants_configuration_cost(
--   public.create_default_product_configuration('COTTON_PANTS', 'M'));
