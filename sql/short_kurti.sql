-- =============================================================
-- SHORT KURTI  (run once in the Supabase SQL editor; safe to re-run)
-- Run sql/pants.sql and sql/kurti.sql FIRST (they install the pricing engine
-- and the shared option groups this uses).
--
-- Adds the SHORT_KURTI garment (product COTTON_SHORT_KURTI):
--   * pictures are stacked layers: body (Style) + Neck + Sleeve (left + right pictures)
--   * Pockets, Knot at back, Knot at hip, Zipper change the PRICE only
--   * material Cotton + Satin, colours copied from the shirt (same as the kurti)
--   * ALL COSTS ARE PLACEHOLDERS - edit them later (see docs/short-kurti.md)
-- =============================================================

do $$
declare
  v_g uuid;
  v_pb uuid;
  v_p uuid;
begin
  -- ---------- 1. garment ----------
  insert into public.garment_master (garment_code, garment_type, is_active)
  select 'SHORT_KURTI', 'Short Kurti', true
  where not exists (select 1 from public.garment_master where garment_code = 'SHORT_KURTI');
  v_g := (select id from public.garment_master where garment_code = 'SHORT_KURTI');
  v_pb := (select id from public.price_book_master where price_book_code = 'PB_2026_01');

  -- ---------- 2. option values (groups already exist from kurti.sql / shirt) ----------
  drop table if exists pg_temp._kv;
  create temporary table _kv (grp text, code text, name text, ord int, is_default boolean);
  insert into _kv values
    ('STYLE','SHORT_STRAIGHT','Straight',1,true),
    ('STYLE','SHORT_A_LINE','A-line',2,false),
    ('STYLE','SHORT_EMPIRE_LINE','Empire line',3,false),
    ('STYLE','SHORT_ANARKALI','Anarkali',4,false),
    ('STYLE','SHORT_HIGH_LOW','High-low',5,false),
    ('STYLE','SHORT_EMPIRE_A_LINE','Empire A-line',6,false),
    ('STYLE','SHORT_FLARED','Flared',7,false),
    ('STYLE','SHORT_FRONT_SLIT','Front slit',8,false),
    ('STYLE','SHORT_PEPLUM','Peplum',9,false),
    ('STYLE','SHORT_SHIRT','Shirt style',10,false),
    ('NECK','NECK_BOW','Bow',11,false),
    ('NECK','NECK_DOUBLE','Double',12,false),
    ('NECK','NECK_HEART','Heart',13,false),
    ('NECK','NECK_KEYHOLE','Keyhole',14,false),
    ('NECK','NECK_MANDARIN','Mandarin',15,false),
    ('NECK','NECK_NOTCHED','Notched',16,false),
    ('NECK','NECK_PETER_PAN','Peter Pan',17,false),
    ('NECK','NECK_ROUND','Round',18,true),
    ('NECK','NECK_SAILOR','Sailor',19,false),
    ('NECK','NECK_SCALLOP','Scallop',20,false),
    ('NECK','NECK_SQUARE','Square',21,false),
    ('NECK','NECK_V','V-neck',22,false),
    ('SLEEVE','BELL','Bell',23,false),
    ('SLEEVE','CAP','Cap',24,false),
    ('SLEEVE','FLARED_SLEEVE','Flared',25,false),
    ('SLEEVE','FULL','Full',26,false),
    ('SLEEVE','HALF','Half',27,true),
    ('SLEEVE','LARGE_BISHOP','Large bishop',28,false),
    ('SLEEVE','NO_SLEEVE','No sleeve',29,false),
    ('SLEEVE','PETAL','Petal',30,false),
    ('SLEEVE','PUFF','Puff',31,false),
    ('SLEEVE','SMALL_BISHOP','Small bishop',32,false),
    ('SLEEVE','THREE_QUARTER','3/4',33,false),
    ('KURTI_POCKETS','POCKETS_YES','Yes',34,true),
    ('KURTI_POCKETS','POCKETS_NO','No',35,false),
    ('KNOT_BACK','KNOT_BACK_YES','Yes',36,true),
    ('KNOT_BACK','KNOT_BACK_NO','No',37,false),
    ('KNOT_HIP','KNOT_HIP_YES','Yes',38,true),
    ('KNOT_HIP','KNOT_HIP_NO','No',39,false),
    ('ZIPPER','ZIPPER_YES','Yes',40,false),
    ('ZIPPER','ZIPPER_NO','No',41,true);

  drop table if exists pg_temp._ka;
  create temporary table _ka (grp text, code text, layer text, side text, file text, z int, name text);
  insert into _ka values
    ('STYLE','SHORT_STRAIGHT','BODY','CENTER','short_kurti_body_straight.webp',1,'Straight'),
    ('STYLE','SHORT_A_LINE','BODY','CENTER','short_kurti_body_a_line.webp',1,'A-line'),
    ('STYLE','SHORT_EMPIRE_LINE','BODY','CENTER','short_kurti_body_empire_line.webp',1,'Empire line'),
    ('STYLE','SHORT_ANARKALI','BODY','CENTER','short_kurti_body_anarkali.webp',1,'Anarkali'),
    ('STYLE','SHORT_HIGH_LOW','BODY','CENTER','short_kurti_body_high_low.webp',1,'High-low'),
    ('STYLE','SHORT_EMPIRE_A_LINE','BODY','CENTER','short_kurti_body_empire_a_line.webp',1,'Empire A-line'),
    ('STYLE','SHORT_FLARED','BODY','CENTER','short_kurti_body_flared.webp',1,'Flared'),
    ('STYLE','SHORT_FRONT_SLIT','BODY','CENTER','short_kurti_body_front_slit.webp',1,'Front slit'),
    ('STYLE','SHORT_PEPLUM','BODY','CENTER','short_kurti_body_peplum.webp',1,'Peplum'),
    ('STYLE','SHORT_SHIRT','BODY','CENTER','short_kurti_body_shirt.webp',1,'Shirt style'),
    ('NECK','NECK_BOW','NECK','CENTER','short_kurti_neck_bow.webp',3,'Bow'),
    ('NECK','NECK_DOUBLE','NECK','CENTER','short_kurti_neck_double.webp',3,'Double'),
    ('NECK','NECK_HEART','NECK','CENTER','short_kurti_neck_heart.webp',3,'Heart'),
    ('NECK','NECK_KEYHOLE','NECK','CENTER','short_kurti_neck_keyhole.webp',3,'Keyhole'),
    ('NECK','NECK_MANDARIN','NECK','CENTER','short_kurti_neck_mandarin.webp',3,'Mandarin'),
    ('NECK','NECK_NOTCHED','NECK','CENTER','short_kurti_neck_notched.webp',3,'Notched'),
    ('NECK','NECK_PETER_PAN','NECK','CENTER','short_kurti_neck_peter_pan.webp',3,'Peter Pan'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti_neck_round.webp',3,'Round'),
    ('NECK','NECK_SAILOR','NECK','CENTER','short_kurti_neck_sailor.webp',3,'Sailor'),
    ('NECK','NECK_SCALLOP','NECK','CENTER','short_kurti_neck_scallop.webp',3,'Scallop'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti_neck_square.webp',3,'Square'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti_neck_v.webp',3,'V-neck'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti_sleeve_bell_left.webp',2,'Bell left'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti_sleeve_bell_right.webp',2,'Bell right'),
    ('SLEEVE','CAP','SLEEVE','LEFT','short_kurti_sleeve_cap_left.webp',2,'Cap left'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','short_kurti_sleeve_cap_right.webp',2,'Cap right'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti_sleeve_flared_left.webp',2,'Flared left'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti_sleeve_flared_right.webp',2,'Flared right'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti_sleeve_full_left.webp',2,'Full left'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti_sleeve_full_right.webp',2,'Full right'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti_sleeve_half_left.webp',2,'Half left'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti_sleeve_half_right.webp',2,'Half right'),
    ('SLEEVE','LARGE_BISHOP','SLEEVE','LEFT','short_kurti_sleeve_large_bishop_left.webp',2,'Large bishop left'),
    ('SLEEVE','LARGE_BISHOP','SLEEVE','RIGHT','short_kurti_sleeve_large_bishop_right.webp',2,'Large bishop right'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti_sleeve_none_left.webp',2,'No sleeve left'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti_sleeve_none_right.webp',2,'No sleeve right'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti_sleeve_petal_left.webp',2,'Petal left'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti_sleeve_petal_right.webp',2,'Petal right'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti_sleeve_puff_left.webp',2,'Puff left'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti_sleeve_puff_right.webp',2,'Puff right'),
    ('SLEEVE','SMALL_BISHOP','SLEEVE','LEFT','short_kurti_sleeve_small_bishop_left.webp',2,'Small bishop left'),
    ('SLEEVE','SMALL_BISHOP','SLEEVE','RIGHT','short_kurti_sleeve_small_bishop_right.webp',2,'Small bishop right'),
    ('SLEEVE','THREE_QUARTER','SLEEVE','LEFT','short_kurti_sleeve_three_quarter_left.webp',2,'3/4 left'),
    ('SLEEVE','THREE_QUARTER','SLEEVE','RIGHT','short_kurti_sleeve_three_quarter_right.webp',2,'3/4 right');

  insert into public.option_value_master (option_group_id, option_value_code, option_value_name, is_active, sort_order)
  select g.id, v.code, v.name, true, 100 + v.ord
  from _kv v join public.option_group_master g on g.option_group_code = v.grp
  where not exists (
    select 1 from public.option_value_master x where x.option_group_id = g.id and x.option_value_code = v.code);

  -- ---------- 3. what the short kurti offers ----------
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

  -- ---------- 4. pictures ----------
  insert into public.asset_set_master (garment_id, asset_set_code, asset_set_name, version_number, is_active)
  select v_g, 'SHORT_KURTI_FRONT_V1', 'Short Kurti Front Customizer V1', 1, true
  where not exists (select 1 from public.asset_set_master where asset_set_code = 'SHORT_KURTI_FRONT_V1');

  insert into public.customizer_asset
    (asset_set_id, asset_code, asset_name, asset_group, asset_side, file_key, width, height, z_index, is_active, is_base_asset)
  select (select id from public.asset_set_master where asset_set_code = 'SHORT_KURTI_FRONT_V1'),
         'SHORTKURTI_' || v.layer || '_' || v.side || '_' || v.code, 'Short Kurti - ' || v.layer || ' - ' || v.name, v.layer, v.side,
         'short_kurti/v1/' || v.file, 768, 1024, v.z, true, false
  from _ka v
  where not exists (select 1 from public.customizer_asset c where c.asset_code = 'SHORTKURTI_' || v.layer || '_' || v.side || '_' || v.code);

  insert into public.option_value_asset_map (asset_set_id, option_value_id, customizer_asset_id, is_active, sort_order)
  select (select id from public.asset_set_master where asset_set_code = 'SHORT_KURTI_FRONT_V1'), ov.id, ca.id, true, 1
  from _ka v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  join public.customizer_asset ca on ca.asset_code = 'SHORTKURTI_' || v.layer || '_' || v.side || '_' || v.code
  where not exists (
      select 1 from public.option_value_asset_map m
      where m.asset_set_id = (select id from public.asset_set_master where asset_set_code = 'SHORT_KURTI_FRONT_V1')
        and m.option_value_id = ov.id and m.customizer_asset_id = ca.id);

  -- ---------- 5. the product ----------
  insert into public.product_master (garment_id, product_code, product_name, is_customizable, is_active)
  select v_g, 'COTTON_SHORT_KURTI', 'Cotton Short Kurti', true, true
  where not exists (select 1 from public.product_master where product_code = 'COTTON_SHORT_KURTI');
  v_p := (select id from public.product_master where product_code = 'COTTON_SHORT_KURTI');

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

  -- starting look: Straight, Round neck, Half sleeve, pockets yes, back knot yes,
  -- hip knot yes, zipper no
  insert into public.product_option_value_map (product_id, option_group_id, option_value_id, is_default, is_active)
  select v_p, g.id, ov.id, v.is_default, true
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where not exists (select 1 from public.product_option_value_map x where x.product_id = v_p and x.option_value_id = ov.id);

  -- ---------- 6. PLACEHOLDER COSTS (edit these later) ----------
  insert into public.garment_material_price (price_book_id, garment_id, material_id, price_per_meter)
  select v_pb, v_g, m.id, case m.material_code when 'COTTON' then 320 else 520 end
  from public.material_master m
  where m.material_code in ('COTTON', 'SATIN')
  on conflict (price_book_id, garment_id, material_id) do nothing;

  insert into public.garment_size_fabric_consumption (garment_id, size_id, fabric_meters, is_active)
  select v_g, s.id,
         case s.size_code when '2XS' then 1.60 when 'XS' then 1.65 when 'S' then 1.70 when 'M' then 1.80
           when 'L' then 1.90 when 'XL' then 2.00 when '2XL' then 2.10 when '3XL' then 2.20
           when '4XL' then 2.30 when '5XL' then 2.40 else 2.50 end, true
  from public.size_master s
  where not exists (select 1 from public.garment_size_fabric_consumption x where x.garment_id = v_g and x.size_id = s.id);

  insert into public.garment_base_cost (price_book_id, garment_id, cost_code, cost_name, fixed_cost, is_active)
  select v_pb, v_g, c.code, c.name, c.amount, true
  from (values ('STITCHING','Stitching',450),('PACKING','Packing',50),('SHIPPING','Shipping',80)) c(code, name, amount)
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

  drop table if exists pg_temp._kc;
  create temporary table _kc (grp text, code text, cost numeric, fabric numeric);
  insert into _kc values
    ('STYLE','SHORT_STRAIGHT',0,0),
    ('STYLE','SHORT_A_LINE',30,0.2),
    ('STYLE','SHORT_EMPIRE_LINE',40,0.3),
    ('STYLE','SHORT_ANARKALI',70,0.8),
    ('STYLE','SHORT_HIGH_LOW',55,0.5),
    ('STYLE','SHORT_EMPIRE_A_LINE',50,0.4),
    ('STYLE','SHORT_FLARED',60,0.5),
    ('STYLE','SHORT_FRONT_SLIT',25,0.05),
    ('STYLE','SHORT_PEPLUM',50,0.35),
    ('STYLE','SHORT_SHIRT',20,0.1),
    ('NECK','NECK_BOW',40,0.05),
    ('NECK','NECK_DOUBLE',40,0.04),
    ('NECK','NECK_HEART',40,0.05),
    ('NECK','NECK_KEYHOLE',15,0.02),
    ('NECK','NECK_MANDARIN',20,0.02),
    ('NECK','NECK_NOTCHED',30,0.03),
    ('NECK','NECK_PETER_PAN',30,0.03),
    ('NECK','NECK_ROUND',10,0),
    ('NECK','NECK_SAILOR',40,0.05),
    ('NECK','NECK_SCALLOP',40,0.04),
    ('NECK','NECK_SQUARE',20,0.03),
    ('NECK','NECK_V',10,0),
    ('SLEEVE','BELL',30,0.5),
    ('SLEEVE','CAP',0,0.1),
    ('SLEEVE','FLARED_SLEEVE',30,0.45),
    ('SLEEVE','FULL',0,0.55),
    ('SLEEVE','HALF',0,0.25),
    ('SLEEVE','LARGE_BISHOP',40,0.6),
    ('SLEEVE','NO_SLEEVE',0,0),
    ('SLEEVE','PETAL',20,0.25),
    ('SLEEVE','PUFF',20,0.3),
    ('SLEEVE','SMALL_BISHOP',30,0.35),
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
  drop table if exists pg_temp._ka;
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
--   select public.create_default_product_configuration('COTTON_SHORT_KURTI', 'M') as id;
--   select selling_price, total_fabric_meters from public.product_configuration where id = '<id>';
