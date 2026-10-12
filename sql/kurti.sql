-- =============================================================
-- KURTI  (run once in the Supabase SQL editor; safe to re-run)
-- Run sql/pants.sql FIRST (it installs the pricing engine this uses).
--
-- Adds the KURTI garment:
--   * pictures are 3 stacked layers: body shape (Style) + Neck + Sleeve
--   * Pockets, Knot at back, Knot at hip, Zipper change the PRICE only
--   * material Cotton + Satin, colours copied from the shirt
--   * ALL COSTS ARE PLACEHOLDERS - edit them later (see docs/kurti.md)
-- Pricing works like pants: size fabric + fabric of every selected option,
-- priced at the kurti fabric price, plus option costs and the usual rules.
-- =============================================================

do $$
declare
  v_g uuid;
  v_pb uuid;
  v_p uuid;
begin
  -- ---------- 1. garment ----------
  insert into public.garment_master (garment_code, garment_type, is_active)
  select 'KURTI', 'Kurti', true
  where not exists (select 1 from public.garment_master where garment_code = 'KURTI');
  v_g := (select id from public.garment_master where garment_code = 'KURTI');
  v_pb := (select id from public.price_book_master where price_book_code = 'PB_2026_01');

  -- ---------- 2. new option groups (Sleeve already exists, shared with shirts) ----------
  insert into public.option_group_master (option_group_code, option_group_name, is_active, sort_order)
  select v.code, v.name, true, v.ord
  from (values
    ('STYLE',         'Style',         70),
    ('NECK',          'Neck',          71),
    ('KURTI_POCKETS', 'Pockets',       72),
    ('KNOT_BACK',     'Knot at back',  73),
    ('KNOT_HIP',      'Knot at hip',   74),
    ('ZIPPER',        'Zipper',        75)
  ) as v(code, name, ord)
  where not exists (select 1 from public.option_group_master g where g.option_group_code = v.code);

  -- ---------- 3. option values + which picture each one shows ----------
  drop table if exists pg_temp._kv;
  create temporary table _kv (grp text, code text, name text, ord int, is_default boolean, file text, layer text, z int);
  insert into _kv values
    ('STYLE','KURTI_STRAIGHT','Straight',1,true,'kurti_body_straight.webp','BODY',1),
    ('STYLE','KURTI_A_LINE','A-line',2,false,'kurti_body_a_line.webp','BODY',1),
    ('STYLE','KURTI_ANARKALI','Anarkali',3,false,'kurti_body_anarkali.webp','BODY',1),
    ('STYLE','KURTI_EMPIRE_LINE','Empire line',4,false,'kurti_body_empire_line.webp','BODY',1),
    ('STYLE','KURTI_FLARED_HIGH_LOW','Flared high-low',5,false,'kurti_body_flared_high_low.webp','BODY',1),
    ('STYLE','KURTI_FRONT_SLIT','Front slit',6,false,'kurti_body_front_slit.webp','BODY',1),
    ('STYLE','KURTI_HIGH_LOW','High-low',7,false,'kurti_body_high_low.webp','BODY',1),
    ('STYLE','KURTI_OPEN_SLIT','Open slit',8,false,'kurti_body_open_slit.webp','BODY',1),
    ('NECK','NECK_BOW','Bow',9,false,'kurti_neck_bow.webp','NECK',3),
    ('NECK','NECK_CLASSIC','Classic',10,true,'kurti_neck_classic.webp','NECK',3),
    ('NECK','NECK_DOUBLE','Double',11,false,'kurti_neck_double.webp','NECK',3),
    ('NECK','NECK_MANDARIN','Mandarin',12,false,'kurti_neck_mandarin.webp','NECK',3),
    ('NECK','NECK_NOTCHED','Notched',13,false,'kurti_neck_notched.webp','NECK',3),
    ('NECK','NECK_PETER_PAN','Peter Pan',14,false,'kurti_neck_peter_pan.webp','NECK',3),
    ('NECK','NECK_ROUND','Round',15,false,'kurti_neck_round.webp','NECK',3),
    ('NECK','NECK_SAILOR','Sailor',16,false,'kurti_neck_sailor.webp','NECK',3),
    ('NECK','NECK_V','V-neck',17,false,'kurti_neck_v.webp','NECK',3),
    ('SLEEVE','BELL','Bell',18,false,'kurti_sleeve_bell.webp','SLEEVE',2),
    ('SLEEVE','BISHOP','Bishop',19,false,'kurti_sleeve_bishop.webp','SLEEVE',2),
    ('SLEEVE','CAP','Cap',20,false,'kurti_sleeve_cap.webp','SLEEVE',2),
    ('SLEEVE','FLARED_SLEEVE','Flared',21,false,'kurti_sleeve_flared.webp','SLEEVE',2),
    ('SLEEVE','FULL','Full',22,false,'kurti_sleeve_full.webp','SLEEVE',2),
    ('SLEEVE','HALF','Half',23,true,'kurti_sleeve_half.webp','SLEEVE',2),
    ('SLEEVE','NO_SLEEVE','No sleeve',24,false,'kurti_sleeve_none.webp','SLEEVE',2),
    ('SLEEVE','PETAL','Petal',25,false,'kurti_sleeve_petal.webp','SLEEVE',2),
    ('SLEEVE','PUFF','Puff',26,false,'kurti_sleeve_puff.webp','SLEEVE',2),
    ('SLEEVE','THREE_QUARTER','3/4',27,false,'kurti_sleeve_three_quarter.webp','SLEEVE',2),
    ('KURTI_POCKETS','POCKETS_YES','Yes',1,true,null,null,null),
    ('KURTI_POCKETS','POCKETS_NO','No',2,false,null,null,null),
    ('KNOT_BACK','KNOT_BACK_YES','Yes',1,true,null,null,null),
    ('KNOT_BACK','KNOT_BACK_NO','No',2,false,null,null,null),
    ('KNOT_HIP','KNOT_HIP_YES','Yes',1,true,null,null,null),
    ('KNOT_HIP','KNOT_HIP_NO','No',2,false,null,null,null),
    ('ZIPPER','ZIPPER_YES','Yes',1,false,null,null,null),
    ('ZIPPER','ZIPPER_NO','No',2,true,null,null,null);

  insert into public.option_value_master (option_group_id, option_value_code, option_value_name, is_active, sort_order)
  select g.id, v.code, v.name, true, v.ord
  from _kv v join public.option_group_master g on g.option_group_code = v.grp
  where not exists (
    select 1 from public.option_value_master x where x.option_group_id = g.id and x.option_value_code = v.code);

  -- ---------- 4. what the kurti offers ----------
  insert into public.garment_option_group_map (garment_id, option_group_id, is_required, is_active, sort_order)
  select v_g, g.id, true, true, v.ord
  from (values ('STYLE',1),('NECK',2),('SLEEVE',3),('KURTI_POCKETS',4),('KNOT_BACK',5),('KNOT_HIP',6),('ZIPPER',7)) v(code, ord)
  join public.option_group_master g on g.option_group_code = v.code
  where not exists (select 1 from public.garment_option_group_map m where m.garment_id = v_g and m.option_group_id = g.id);

  insert into public.garment_option_value_map (garment_id, option_value_id, is_active, sort_order)
  select v_g, ov.id, true, v.ord
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where not exists (select 1 from public.garment_option_value_map m where m.garment_id = v_g and m.option_value_id = ov.id);

  -- ---------- 5. pictures ----------
  insert into public.asset_set_master (garment_id, asset_set_code, asset_set_name, version_number, is_active)
  select v_g, 'KURTI_FRONT_V1', 'Kurti Front Customizer V1', 1, true
  where not exists (select 1 from public.asset_set_master where asset_set_code = 'KURTI_FRONT_V1');

  insert into public.customizer_asset
    (asset_set_id, asset_code, asset_name, asset_group, asset_side, file_key, width, height, z_index, is_active, is_base_asset)
  select (select id from public.asset_set_master where asset_set_code = 'KURTI_FRONT_V1'),
         'KURTI_' || v.layer || '_' || v.code, 'Kurti - ' || v.layer || ' - ' || v.name, v.layer, 'CENTER',
         'kurti/v1/' || v.file, 1024, 1024, v.z, true, false
  from _kv v
  where v.file is not null
    and not exists (select 1 from public.customizer_asset c where c.asset_code = 'KURTI_' || v.layer || '_' || v.code);

  insert into public.option_value_asset_map (asset_set_id, option_value_id, customizer_asset_id, is_active, sort_order)
  select (select id from public.asset_set_master where asset_set_code = 'KURTI_FRONT_V1'), ov.id, ca.id, true, 1
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  join public.customizer_asset ca on ca.asset_code = 'KURTI_' || v.layer || '_' || v.code
  where v.file is not null
    and not exists (
      select 1 from public.option_value_asset_map m
      where m.asset_set_id = (select id from public.asset_set_master where asset_set_code = 'KURTI_FRONT_V1')
        and m.option_value_id = ov.id and m.customizer_asset_id = ca.id);

  -- ---------- 6. the product ----------
  insert into public.product_master (garment_id, product_code, product_name, is_customizable, is_active)
  select v_g, 'COTTON_KURTI', 'Cotton Kurti', true, true
  where not exists (select 1 from public.product_master where product_code = 'COTTON_KURTI');
  v_p := (select id from public.product_master where product_code = 'COTTON_KURTI');

  insert into public.product_size_map (product_id, size_id, is_active, sort_order)
  select v_p, s.id, true, s.size_order
  from public.size_master s
  where s.is_active = true
    and not exists (select 1 from public.product_size_map m where m.product_id = v_p and m.size_id = s.id);

  insert into public.product_material_map (product_id, material_id, is_default, is_active, sort_order)
  select v_p, m.id, (m.material_code = 'COTTON'), true, case m.material_code when 'COTTON' then 1 else 2 end
  from public.material_master m
  where m.material_code in ('COTTON', 'SATIN')
    and not exists (select 1 from public.product_material_map x where x.product_id = v_p and x.material_id = m.id);

  -- colours: the same ones the shirt offers for Cotton and Satin
  insert into public.product_material_color_map (product_id, material_id, color_id, is_default, is_active)
  select v_p, s.material_id, s.color_id, s.is_default, true
  from public.product_material_color_map s
  join public.product_master sp on sp.id = s.product_id and sp.product_code = 'WHITE_COTTON_SHIRT'
  join public.material_master m on m.id = s.material_id and m.material_code in ('COTTON', 'SATIN')
  where s.is_active = true
    and not exists (select 1 from public.product_material_color_map x
                    where x.product_id = v_p and x.material_id = s.material_id and x.color_id = s.color_id);

  -- product-level colour list = every colour used above; default = Cotton's default
  insert into public.product_color_map (product_id, color_id, is_default, is_active, sort_order)
  select v_p, c.color_id,
         bool_or(c.is_default and m.material_code = 'COTTON'),
         true,
         row_number() over (order by cm.color_name)
  from public.product_material_color_map c
  join public.material_master m on m.id = c.material_id
  join public.color_master cm on cm.id = c.color_id
  where c.product_id = v_p
    and not exists (select 1 from public.product_color_map x where x.product_id = v_p and x.color_id = c.color_id)
  group by c.color_id, cm.color_name;

  -- safety net: if nothing was copied (shirt colours missing), fall back to White
  if not exists (select 1 from public.product_color_map where product_id = v_p) then
    insert into public.product_color_map (product_id, color_id, is_default, is_active, sort_order)
    select v_p, c.id, true, true, 1 from public.color_master c where c.color_code = 'WHITE';
    insert into public.product_material_color_map (product_id, material_id, color_id, is_default, is_active)
    select v_p, m.id, c.id, true, true
    from public.material_master m, public.color_master c
    where c.color_code = 'WHITE' and m.material_code in ('COTTON', 'SATIN');
  end if;
  if not exists (select 1 from public.product_color_map where product_id = v_p and is_default) then
    update public.product_color_map set is_default = true
    where id = (select id from public.product_color_map where product_id = v_p order by sort_order limit 1);
  end if;

  -- starting look: Straight, Classic neck, Half sleeve, pockets yes, back knot yes,
  -- hip knot yes, zipper no
  insert into public.product_option_value_map (product_id, option_group_id, option_value_id, is_default, is_active)
  select v_p, g.id, ov.id, v.is_default, true
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where not exists (select 1 from public.product_option_value_map x where x.product_id = v_p and x.option_value_id = ov.id);

  -- ---------- 7. PLACEHOLDER COSTS (edit these later) ----------
  -- kurti fabric price per metre (separate from shirt and pants)
  insert into public.garment_material_price (price_book_id, garment_id, material_id, price_per_meter)
  select v_pb, v_g, m.id, case m.material_code when 'COTTON' then 320 else 520 end
  from public.material_master m
  where m.material_code in ('COTTON', 'SATIN')
  on conflict (price_book_id, garment_id, material_id) do nothing;

  -- fabric per size (metres)
  insert into public.garment_size_fabric_consumption (garment_id, size_id, fabric_meters, is_active)
  select v_g, s.id,
         case s.size_code when '2XS' then 2.30 when 'XS' then 2.40 when 'S' then 2.50 when 'M' then 2.60
           when 'L' then 2.70 when 'XL' then 2.80 when '2XL' then 2.90 when '3XL' then 3.00
           when '4XL' then 3.10 when '5XL' then 3.20 else 3.30 end, true
  from public.size_master s
  where not exists (select 1 from public.garment_size_fabric_consumption x where x.garment_id = v_g and x.size_id = s.id);

  insert into public.garment_base_cost (price_book_id, garment_id, cost_code, cost_name, fixed_cost, is_active)
  select v_pb, v_g, c.code, c.name, c.amount, true
  from (values ('STITCHING','Stitching',550),('PACKING','Packing',50),('SHIPPING','Shipping',90)) c(code, name, amount)
  where not exists (select 1 from public.garment_base_cost x where x.price_book_id = v_pb and x.garment_id = v_g and x.cost_code = c.code);

  insert into public.garment_cost_rule (price_book_id, garment_id, cost_code, cost_name, cost_type, cost_value, is_active)
  select v_pb, v_g, c.code, c.name, c.ctype, c.val, true
  from (values ('OTHER_OVERHEAD','Other overhead','FIXED',0),
               ('REMAKE_ALLOWANCE','Remake allowance','PERCENT',3),
               ('PAYMENT_FEE','Payment fee','PERCENT',2.5)) c(code, name, ctype, val)
  where not exists (select 1 from public.garment_cost_rule x where x.price_book_id = v_pb and x.garment_id = v_g and x.cost_code = c.code);

  insert into public.garment_profit_rule
    (price_book_id, garment_id, fixed_profit_type, fixed_profit_value, additional_profit_type, additional_profit_value, is_active)
  select v_pb, v_g, 'PERCENT', 15, 'PERCENT', 25, true
  where not exists (select 1 from public.garment_profit_rule x where x.price_book_id = v_pb and x.garment_id = v_g);

  -- cost (Rs) and extra fabric (metres, never negative) of each option
  drop table if exists pg_temp._kc;
  create temporary table _kc (grp text, code text, cost numeric, fabric numeric);
  insert into _kc values
    ('STYLE','KURTI_STRAIGHT',0,0),
    ('STYLE','KURTI_A_LINE',40,0.3),
    ('STYLE','KURTI_ANARKALI',90,1.2),
    ('STYLE','KURTI_EMPIRE_LINE',60,0.6),
    ('STYLE','KURTI_FLARED_HIGH_LOW',100,1.0),
    ('STYLE','KURTI_FRONT_SLIT',30,0.05),
    ('STYLE','KURTI_HIGH_LOW',70,0.4),
    ('STYLE','KURTI_OPEN_SLIT',50,0.3),
    ('NECK','NECK_BOW',40,0.05),
    ('NECK','NECK_CLASSIC',25,0.02),
    ('NECK','NECK_DOUBLE',40,0.04),
    ('NECK','NECK_MANDARIN',20,0.02),
    ('NECK','NECK_NOTCHED',30,0.03),
    ('NECK','NECK_PETER_PAN',30,0.03),
    ('NECK','NECK_ROUND',10,0),
    ('NECK','NECK_SAILOR',40,0.05),
    ('NECK','NECK_V',10,0),
    ('SLEEVE','BELL',30,0.5),
    ('SLEEVE','BISHOP',35,0.6),
    ('SLEEVE','CAP',0,0.1),
    ('SLEEVE','FLARED_SLEEVE',30,0.45),
    ('SLEEVE','FULL',0,0.55),
    ('SLEEVE','HALF',0,0.25),
    ('SLEEVE','NO_SLEEVE',0,0),
    ('SLEEVE','PETAL',20,0.25),
    ('SLEEVE','PUFF',20,0.3),
    ('SLEEVE','THREE_QUARTER',0,0.4),
    ('KURTI_POCKETS','POCKETS_YES',30,0.05),
    ('KURTI_POCKETS','POCKETS_NO',0,0),
    ('KNOT_BACK','KNOT_BACK_YES',20,0.05),
    ('KNOT_BACK','KNOT_BACK_NO',0,0),
    ('KNOT_HIP','KNOT_HIP_YES',20,0.05),
    ('KNOT_HIP','KNOT_HIP_NO',0,0),
    ('ZIPPER','ZIPPER_YES',40,0.03),
    ('ZIPPER','ZIPPER_NO',0,0);

  insert into public.option_fixed_cost (price_book_id, garment_id, option_value_id, fixed_cost)
  select v_pb, v_g, ov.id, k.cost
  from _kc k
  join public.option_group_master g on g.option_group_code = k.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = k.code
  where not exists (select 1 from public.option_fixed_cost x
                    where x.price_book_id = v_pb and x.garment_id = v_g and x.option_value_id = ov.id);

  insert into public.option_fabric_consumption (garment_id, option_value_id, fabric_meters, is_active)
  select v_g, ov.id, k.fabric, true
  from _kc k
  join public.option_group_master g on g.option_group_code = k.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = k.code
  where not exists (select 1 from public.option_fabric_consumption x
                    where x.garment_id = v_g and x.option_value_id = ov.id);

  drop table if exists pg_temp._kv;
  drop table if exists pg_temp._kc;
end $$;

-- ---------- 8. pricing engine: every garment except shirts uses the options-based one ----------
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

-- Check (run as two separate queries):
--   select public.create_default_product_configuration('COTTON_KURTI', 'M') as id;
--   select selling_price, total_fabric_meters from public.product_configuration where id = '<id>';
