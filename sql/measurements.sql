-- =====================================================================
-- Oh Must: one measurement profile per customer (shirt, pants, kurti ...),
-- first "My size" order discount, and the free first remake.
--
-- Run this once in the Supabase SQL editor. It is safe to run again.
-- Nothing here changes the standard-size flow.
--
-- Rules (change the numbers here and nowhere else):
--   * 15 %  off the customer's FIRST "My size" order (never below the
--           protected price floor).  -> custom_first_order_percent()
--   * Free remake on that first "My size" order only, requested within
--     15 days of delivery, each measurement changed by at most 20 mm (2 cm).
--     -> request_remake()
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Measurement catalogue (everything needed for shirt, pant, kurti ...)
-- ---------------------------------------------------------------------
alter table public.measurement_type_master
  add column if not exists group_name text,
  add column if not exists help_text  text,
  add column if not exists min_mm     integer,
  add column if not exists max_mm     integer,
  add column if not exists video_url  text;

do $$
declare
  r record;
  -- placeholder clip for every measurement; replace per row later with
  --   update measurement_type_master set video_url = '...' where measurement_code = 'CHEST';
  v_video constant text :=
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
begin
  for r in
    select * from (values
      -- code, name, group, sort, min_mm, max_mm, how to measure
      ('HEIGHT','Height','Body',10,1200,2200,'Stand straight, barefoot, back against a wall. Measure from the floor to the top of your head.'),
      ('NECK','Neck circumference','Upper body',20,250,550,'Wrap the tape around the base of your neck, where a collar would sit. Keep one finger between tape and neck.'),
      ('SHOULDER','Shoulder width','Upper body',30,250,550,'Measure across your back from the edge of one shoulder to the edge of the other.'),
      ('CHEST','Chest / bust','Upper body',40,600,1500,'Wrap the tape around the fullest part of your chest, under the arms, keeping it level.'),
      ('UNDER_BUST','Under-bust','Upper body',50,500,1300,'Wrap the tape around your ribcage directly under the bust, keeping it level.'),
      ('ARMHOLE','Armhole circumference','Upper body',60,300,700,'Run the tape around your arm where the sleeve joins the body, over the shoulder point and under the armpit.'),
      ('UPPER_ARM','Upper arm (bicep)','Arms',70,150,550,'Wrap the tape around the widest part of your upper arm, relaxed.'),
      ('WRIST','Wrist','Arms',80,100,250,'Wrap the tape around your wrist bone.'),
      ('SLEEVE_LENGTH','Sleeve length (full)','Arms',90,400,750,'From the shoulder point down the outside of the arm to the wrist bone, arm slightly bent.'),
      ('SLEEVE_THREE_QUARTER','Sleeve length (3/4)','Arms',100,300,650,'From the shoulder point down the outside of the arm to just below the elbow.'),
      ('SLEEVE_HALF','Sleeve length (half)','Arms',110,150,400,'From the shoulder point down the outside of the arm to the middle of the upper arm.'),
      ('CUFF_FULL','Cuff breadth (full sleeve)','Arms',120,60,250,'Width of the cuff opening you like at the wrist, laid flat.'),
      ('CUFF_THREE_QUARTER','Cuff breadth (3/4 sleeve)','Arms',130,60,300,'Width of the cuff opening you like on a 3/4 sleeve, laid flat.'),
      ('CUFF_HALF','Cuff breadth (half sleeve)','Arms',140,60,350,'Width of the cuff opening you like on a half sleeve, laid flat.'),
      ('SHOULDER_TO_ARMHOLE','Shoulder to armhole','Lengths',150,100,300,'From the shoulder point straight down to the bottom of the armpit.'),
      ('SHOULDER_TO_CHEST','Shoulder to chest','Lengths',160,150,400,'From the high point of the shoulder, beside the neck, down to the fullest point of the chest.'),
      ('SHOULDER_TO_HIP','Shoulder to hip','Lengths',170,350,750,'From the high point of the shoulder down to your hip line.'),
      ('SHOULDER_TO_SEAT','Shoulder to seat','Lengths',180,450,900,'From the high point of the shoulder down to the fullest part of your seat.'),
      ('BODY_LENGTH','Shirt / kurti length','Lengths',190,400,1300,'From the high point of the shoulder, beside the neck, down to where you want the garment to end.'),
      ('WAIST','Waist','Lower body',200,400,1500,'Wrap the tape around your natural waist, the narrowest part of your torso.'),
      ('HIP','Hip (high hip)','Lower body',210,600,1600,'Wrap the tape around your body 8 to 10 cm below your waist.'),
      ('SEAT','Seat (fullest part)','Lower body',220,700,1700,'Wrap the tape around the fullest part of your seat, keeping it level.'),
      ('SEAT_WIDTH','Seat width','Lower body',230,200,500,'Straight width across the fullest part of your seat, measured flat from side to side.'),
      ('HIP_TO_PANT_LENGTH','Hip to pant length','Trousers',240,500,1200,'From your hip line down to where you want the pant to end.'),
      ('THIGH','Thigh','Trousers',250,300,900,'Wrap the tape around the fullest part of your thigh, about 5 cm below the crotch.'),
      ('INSEAM','Inseam','Trousers',260,500,1000,'From the crotch down the inside of the leg to the ankle bone.'),
      ('RISE','Rise (crotch depth)','Trousers',270,180,450,'Seated on a chair, measure from the side of your waist down to the chair.'),
      ('KNEE','Knee','Trousers',280,250,600,'Wrap the tape around the middle of your knee, not tight.'),
      ('ANKLE','Ankle / hem','Trousers',290,150,400,'Wrap the tape around your ankle, or measure the leg opening you like.')
    ) as t(code,name,grp,sort,minmm,maxmm,help)
  loop
    update public.measurement_type_master
       set measurement_name = r.name,
           sort_order = r.sort,
           group_name = r.grp,
           min_mm = r.minmm,
           max_mm = r.maxmm,
           help_text = r.help,
           video_url = coalesce(video_url, v_video)
     where measurement_code = r.code;

    if not found then
      insert into public.measurement_type_master (measurement_code, measurement_name, sort_order)
      values (r.code, r.name, r.sort);

      update public.measurement_type_master
         set group_name = r.grp, min_mm = r.minmm, max_mm = r.maxmm,
             help_text = r.help, video_url = v_video
       where measurement_code = r.code;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2. Profiles belong to a signed-in customer
-- ---------------------------------------------------------------------
alter table public.customer_measurement_profile
  add column if not exists user_id       uuid,
  add column if not exists weight_kg     numeric,
  add column if not exists is_order_copy boolean not null default false;

create index if not exists customer_measurement_profile_user_idx
  on public.customer_measurement_profile (user_id);

-- The price snapshot remembers the list price and the discount given.
alter table public.configuration_price_snapshot
  add column if not exists list_price             numeric,
  add column if not exists custom_discount_amount numeric not null default 0;

-- ---------------------------------------------------------------------
-- 3. "First My size order" bookkeeping
-- ---------------------------------------------------------------------
create table if not exists public.custom_first_order_used (
  user_id             uuid primary key,
  checkout_session_id uuid,
  used_at             timestamptz not null default now()
);
alter table public.custom_first_order_used enable row level security;
drop policy if exists "own first order" on public.custom_first_order_used;
create policy "own first order" on public.custom_first_order_used
  for select to authenticated using (user_id = auth.uid());

-- 15 % for a customer who has not used it yet. Signed-out visitors see
-- the offer too (it is verified again when the price is frozen).
create or replace function public.custom_first_order_percent(p_user uuid)
returns numeric
language sql stable security definer set search_path = public
as $$
  select case
    when p_user is not null
     and exists (select 1 from public.custom_first_order_used where user_id = p_user)
      then 0::numeric
    else 15::numeric
  end;
$$;

-- discounted price, never below the protected floor
create or replace function public.custom_offer_price(p_list numeric, p_floor numeric, p_percent numeric)
returns numeric
language sql immutable
as $$
  select greatest(p_floor, round(p_list * (100 - p_percent) / 100, 2));
$$;

-- ---------------------------------------------------------------------
-- 4. Reading and writing profiles (signed-in customer only)
-- ---------------------------------------------------------------------
create or replace function public.get_measurement_form()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', measurement_code,
           'name', measurement_name,
           'group', group_name,
           'help', help_text,
           'minMm', min_mm,
           'maxMm', max_mm,
           'videoUrl', video_url
         ) order by sort_order), '[]'::jsonb)
  from public.measurement_type_master
  where group_name is not null;
$$;

create or replace function public.get_my_measurement_profiles()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id,
           'name', p.profile_name,
           'isDefault', p.is_default,
           'weightKg', p.weight_kg,
           'updatedAt', p.updated_at,
           'values', (
             select coalesce(jsonb_object_agg(t.measurement_code, v.measurement_mm), '{}'::jsonb)
             from public.customer_measurement_value v
             join public.measurement_type_master t on t.id = v.measurement_type_id
             where v.measurement_profile_id = p.id
           )
         ) order by p.is_default desc, p.updated_at desc), '[]'::jsonb)
  from public.customer_measurement_profile p
  where p.user_id = auth.uid()
    and p.is_active
    and not p.is_order_copy;
$$;

create or replace function public.save_my_measurement_profile(
  p_profile_id   uuid,
  p_name         text,
  p_values       jsonb,
  p_weight_kg    numeric default null,
  p_make_default boolean default false
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_profile uuid;
  r         record;
  t         record;
  v_mm      integer;
  v_count   integer;
begin
  if v_user is null then
    raise exception 'Please sign in to save measurements';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Please give this measurement profile a name';
  end if;
  if p_values is null or not (p_values ? 'CHEST' and p_values ? 'WAIST' and p_values ? 'HIP') then
    raise exception 'Chest, waist and hip are required';
  end if;

  if p_profile_id is null then
    insert into public.customer_measurement_profile
      (customer_reference, user_id, profile_name, is_default, is_active, weight_kg)
    values (v_user::text, v_user, trim(p_name), false, true, p_weight_kg)
    returning id into v_profile;
  else
    select id into v_profile
    from public.customer_measurement_profile
    where id = p_profile_id and user_id = v_user and is_active and not is_order_copy;
    if v_profile is null then
      raise exception 'Measurement profile not found';
    end if;
    update public.customer_measurement_profile
       set profile_name = trim(p_name), weight_kg = p_weight_kg, updated_at = now()
     where id = v_profile;
  end if;

  for r in select key, value from jsonb_each_text(p_values) loop
    select id, measurement_name, min_mm, max_mm into t
    from public.measurement_type_master
    where measurement_code = r.key;
    if not found then
      raise exception 'Unknown measurement %', r.key;
    end if;

    v_mm := round(r.value::numeric)::integer;
    if t.min_mm is not null and (v_mm < t.min_mm or v_mm > t.max_mm) then
      raise exception '% should be between % and % cm (% to % inches)',
        t.measurement_name, t.min_mm / 10.0, t.max_mm / 10.0,
        round(t.min_mm / 25.4, 1), round(t.max_mm / 25.4, 1);
    end if;

    update public.customer_measurement_value
       set measurement_mm = v_mm, updated_at = now()
     where measurement_profile_id = v_profile and measurement_type_id = t.id;
    if not found then
      insert into public.customer_measurement_value
        (measurement_profile_id, measurement_type_id, measurement_mm)
      values (v_profile, t.id, v_mm);
    end if;
  end loop;

  -- the first profile is the default automatically
  select count(*) into v_count
  from public.customer_measurement_profile
  where user_id = v_user and is_active and not is_order_copy;

  if p_make_default or v_count = 1 then
    update public.customer_measurement_profile
       set is_default = (id = v_profile)
     where user_id = v_user and is_active and not is_order_copy;
  end if;

  return v_profile;
end;
$$;

create or replace function public.delete_my_measurement_profile(p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.customer_measurement_profile
     set is_active = false, is_default = false, updated_at = now()
   where id = p_profile_id and user_id = auth.uid() and not is_order_copy;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Using a profile on a configuration
--    The order gets its own frozen COPY, so editing the saved profile
--    later can never change an order that is already in the bag/paid.
-- ---------------------------------------------------------------------
create or replace function public.apply_my_profile_to_configuration(
  p_configuration_id uuid,
  p_profile_id       uuid
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_src     public.customer_measurement_profile%rowtype;
  v_copy    uuid;
  v_pricing uuid;
begin
  if v_user is null then
    raise exception 'Please sign in to use your measurements';
  end if;

  perform public.assert_configuration_editable(p_configuration_id);

  select * into v_src
  from public.customer_measurement_profile
  where id = p_profile_id and user_id = v_user and is_active and not is_order_copy;
  if not found then
    raise exception 'Measurement profile not found';
  end if;

  select pc.measurement_profile_id into v_copy
  from public.product_configuration pc
  where pc.id = p_configuration_id;

  if v_copy is not null and exists (
       select 1 from public.customer_measurement_profile where id = v_copy and is_order_copy) then
    delete from public.customer_measurement_value where measurement_profile_id = v_copy;
    update public.customer_measurement_profile
       set profile_name = 'Order: ' || v_src.profile_name,
           weight_kg = v_src.weight_kg,
           user_id = v_user,
           customer_reference = v_user::text,
           updated_at = now()
     where id = v_copy;
  else
    insert into public.customer_measurement_profile
      (customer_reference, user_id, profile_name, is_default, is_active, weight_kg, is_order_copy)
    values (v_user::text, v_user, 'Order: ' || v_src.profile_name, false, true, v_src.weight_kg, true)
    returning id into v_copy;
  end if;

  insert into public.customer_measurement_value (measurement_profile_id, measurement_type_id, measurement_mm)
  select v_copy, measurement_type_id, measurement_mm
  from public.customer_measurement_value
  where measurement_profile_id = p_profile_id;

  update public.product_configuration
     set measurement_profile_id = v_copy, updated_at = now()
   where id = p_configuration_id;

  v_pricing := public.derive_pricing_size(p_configuration_id);
  perform public.recalculate_configuration(p_configuration_id);
  return v_pricing;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. The offer the customer sees (list price, 15 % price, what they save)
-- ---------------------------------------------------------------------
create or replace function public.get_custom_size_offer(p_configuration_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_list  numeric;
  v_floor numeric;
  v_pct   numeric;
  v_offer numeric;
begin
  select c.selling_price, c.protected_price_floor
    into v_list, v_floor
  from public.calculate_configuration_cost(p_configuration_id) c;

  if v_list is null then
    return jsonb_build_object('eligible', false);
  end if;

  v_pct   := public.custom_first_order_percent(auth.uid());
  v_offer := public.custom_offer_price(v_list, v_floor, v_pct);

  return jsonb_build_object(
    'signedIn', auth.uid() is not null,
    'eligible', v_pct > 0 and v_offer < v_list,
    'percent',  v_pct,
    'listPrice', v_list,
    'offerPrice', v_offer,
    'saving', v_list - v_offer
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Freeze the price: apply the first-order discount to My size lines
--    (replaces the earlier commit_configuration_price)
-- ---------------------------------------------------------------------
create or replace function public.commit_configuration_price(p_configuration_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_price_book_id uuid;
  v_snapshot_id   uuid;
  v_calc          record;
  v_user          uuid;
  v_pct           numeric := 0;
  v_list          numeric;
  v_selling       numeric;
  v_discount      numeric := 0;
  v_additional    numeric;
begin
  select pc.price_book_id into v_price_book_id
  from public.product_configuration pc
  where pc.id = p_configuration_id;

  if v_price_book_id is null then
    raise exception 'Configuration % was not found', p_configuration_id;
  end if;

  select * into v_calc from public.calculate_configuration_cost(p_configuration_id);
  if v_calc.selling_price is null then
    raise exception 'Unable to calculate configuration %', p_configuration_id;
  end if;

  v_list    := v_calc.selling_price;
  v_selling := v_list;
  v_additional := v_calc.additional_profit_amount;

  -- first My size order: the line must use a signed-in customer's profile
  select p.user_id into v_user
  from public.product_configuration pc
  join public.customer_measurement_profile p on p.id = pc.measurement_profile_id
  where pc.id = p_configuration_id;

  if v_user is not null then
    v_pct := public.custom_first_order_percent(v_user);
    if v_pct > 0 then
      v_selling    := public.custom_offer_price(v_list, v_calc.protected_price_floor, v_pct);
      v_discount   := v_list - v_selling;
      v_additional := v_selling - v_calc.protected_price_floor;
    end if;
  end if;

  insert into public.configuration_price_snapshot (
    configuration_id, price_book_id,
    body_fabric_meters, sleeve_fabric_meters, pocket_fabric_meters, total_fabric_meters,
    material_price_per_meter, fabric_cost,
    collar_cost, placket_cost,
    stitching_cost, packing_cost, shipping_cost,
    base_cost_subtotal,
    other_overhead_cost, remake_allowance_cost, payment_fee_cost,
    full_cost,
    fixed_profit_amount, additional_profit_amount,
    protected_price_floor, selling_price,
    max_discount_amount, max_discount_percent,
    list_price, custom_discount_amount
  )
  values (
    p_configuration_id, v_price_book_id,
    v_calc.body_fabric_meters, v_calc.sleeve_fabric_meters, v_calc.pocket_fabric_meters, v_calc.total_fabric_meters,
    v_calc.material_price_per_meter, v_calc.fabric_cost,
    v_calc.collar_cost, v_calc.placket_cost,
    v_calc.stitching_cost, v_calc.packing_cost, v_calc.shipping_cost,
    v_calc.base_cost_subtotal,
    v_calc.other_overhead_cost, v_calc.remake_allowance_cost, v_calc.payment_fee_cost,
    v_calc.full_cost,
    v_calc.fixed_profit_amount, v_additional,
    v_calc.protected_price_floor, v_selling,
    v_additional,
    case when v_selling > 0 then round(v_additional / v_selling * 100, 2) else 0 end,
    v_list, v_discount
  )
  returning id into v_snapshot_id;

  update public.product_configuration
     set total_fabric_meters = v_calc.total_fabric_meters,
         fabric_cost = v_calc.fabric_cost,
         full_cost = v_calc.full_cost,
         selling_price = v_selling,
         current_price_snapshot_id = v_snapshot_id,
         updated_at = now()
   where id = p_configuration_id;

  return v_snapshot_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Free first remake
-- ---------------------------------------------------------------------
alter table public.checkout_sessions
  add column if not exists delivered_at timestamptz;   -- set by you when it is delivered

create table if not exists public.remake_requests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null,
  checkout_session_id uuid not null,
  cart_item_id        uuid not null unique,
  status              text not null default 'REQUESTED',
  reason              text,
  original_values     jsonb not null,
  new_values          jsonb not null,
  created_at          timestamptz not null default now()
);
alter table public.remake_requests enable row level security;
drop policy if exists "own remakes" on public.remake_requests;
create policy "own remakes" on public.remake_requests
  for select to authenticated using (user_id = auth.uid());

create or replace function public.request_remake(
  p_checkout_session_id uuid,
  p_cart_item_id        uuid,
  p_new_values          jsonb,
  p_reason              text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_session public.checkout_sessions%rowtype;
  v_item    jsonb;
  m         record;
  v_orig    jsonb := '{}'::jsonb;
  v_code    text;
  v_old     integer;
  v_new     integer;
  v_id      uuid;
  c_window  constant interval := interval '15 days';   -- request window after delivery
  c_limit   constant integer  := 20;                   -- 20 mm = 2 cm either way
begin
  if v_user is null then
    raise exception 'Please sign in';
  end if;

  select * into v_session
  from public.checkout_sessions
  where id = p_checkout_session_id and user_id = v_user;
  if not found or v_session.status <> 'PAID' then
    raise exception 'Order not found';
  end if;

  if not exists (
       select 1 from public.custom_first_order_used
       where user_id = v_user and checkout_session_id = p_checkout_session_id) then
    raise exception 'The free remake applies to your first My size order only';
  end if;

  if v_session.delivered_at is null then
    raise exception 'You can request a remake once your order is delivered';
  end if;
  if now() > v_session.delivered_at + c_window then
    raise exception 'The remake window (15 days after delivery) has ended';
  end if;

  select e into v_item
  from jsonb_array_elements(v_session.items) e
  where e->>'cart_item_id' = p_cart_item_id::text
    and e->>'measurement_mode' = 'CUSTOM';
  if v_item is null then
    raise exception 'That item was not made to your measurements';
  end if;

  if exists (select 1 from public.remake_requests where cart_item_id = p_cart_item_id) then
    raise exception 'A remake was already requested for this item';
  end if;

  -- every original measurement must be sent back, within +/- 2 cm
  for m in select value from jsonb_array_elements(coalesce(v_item->'measurements', '[]'::jsonb)) loop
    v_code := m.value->>'code';
    v_old  := (m.value->>'measurementMm')::integer;
    v_orig := v_orig || jsonb_build_object(v_code, v_old);

    if not (p_new_values ? v_code) then
      raise exception 'Missing measurement %', m.value->>'name';
    end if;
    v_new := round((p_new_values->>v_code)::numeric)::integer;

    if abs(v_new - v_old) > c_limit then
      raise exception '% can change by at most 2 cm (about 3/4 inch): allowed % to % cm',
        m.value->>'name', (v_old - c_limit) / 10.0, (v_old + c_limit) / 10.0;
    end if;
  end loop;

  insert into public.remake_requests
    (user_id, checkout_session_id, cart_item_id, reason, original_values, new_values)
  values (v_user, p_checkout_session_id, p_cart_item_id, p_reason, v_orig, p_new_values)
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Who may call what
-- ---------------------------------------------------------------------
grant execute on function public.get_measurement_form()                          to anon, authenticated;
grant execute on function public.get_custom_size_offer(uuid)                     to anon, authenticated;
grant execute on function public.custom_first_order_percent(uuid)                to anon, authenticated;
grant execute on function public.get_my_measurement_profiles()                   to authenticated;
grant execute on function public.save_my_measurement_profile(uuid, text, jsonb, numeric, boolean) to authenticated;
grant execute on function public.delete_my_measurement_profile(uuid)             to authenticated;
grant execute on function public.apply_my_profile_to_configuration(uuid, uuid)   to authenticated;
grant execute on function public.request_remake(uuid, uuid, jsonb, text)         to authenticated;
-- commit_configuration_price keeps its existing grants (called from add_configuration_to_cart)
