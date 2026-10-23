-- =============================================================
-- SHORT KURTI v2  (run once in the Supabase SQL editor; safe to re-run)
-- Run AFTER sql/short_kurti.sql (and sql/kurti_v2.sql); it replaces the first short kurti setup.
--
-- Rebuilds the SHORT_KURTI garment for the final picture set:
--   * 10 styles, each with its OWN neck and sleeve pictures
--     (Straight, A-line, Empire line, Empire cut, Angrakha, Flared, Front slit, High-low, Peplum, Shirt style)
--   * a neck / sleeve picture is tagged "@<STYLE>" in its asset_code and is only shown
--     (and only offered) for that style; Angrakha has no neck pictures (its neckline is part of the body)
--   * Pockets, Knot at back, Knot at hip, Zipper change the PRICE only
--   * ALL NEW COSTS ARE PLACEHOLDERS - existing short kurti costs are kept as they are
-- =============================================================

do $$
declare
  v_g uuid;
  v_pb uuid;
  v_p uuid;
  v_set uuid;
begin
  v_g := (select id from public.garment_master where garment_code = 'SHORT_KURTI');
  if v_g is null then
    raise exception 'Run sql/short_kurti.sql first (garment SHORT_KURTI not found)';
  end if;
  v_pb := (select id from public.price_book_master where price_book_code = 'PB_2026_01');
  v_p := (select id from public.product_master where product_code = 'COTTON_SHORT_KURTI');
  v_set := (select id from public.asset_set_master where asset_set_code = 'SHORT_KURTI_FRONT_V1');

  drop table if exists pg_temp._kv;
  create temporary table _kv (grp text, code text, name text, ord int, is_default boolean);
  insert into _kv values
    ('STYLE','SHORT_STRAIGHT','Straight',1,true),
    ('STYLE','SHORT_A_LINE','A-line',2,false),
    ('STYLE','SHORT_EMPIRE_LINE','Empire line',3,false),
    ('STYLE','SHORT_EMPIRE_CUT','Empire cut',4,false),
    ('STYLE','SHORT_ANGRAKHA','Angrakha',5,false),
    ('STYLE','SHORT_FLARED','Flared',6,false),
    ('STYLE','SHORT_FRONT_SLIT','Front slit',7,false),
    ('STYLE','SHORT_HIGH_LOW','High-low',8,false),
    ('STYLE','SHORT_PEPLUM','Peplum',9,false),
    ('STYLE','SHORT_SHIRT','Shirt style',10,false),
    ('NECK','NECK_BOAT','Boat',11,false),
    ('NECK','NECK_CLASSIC_COLLAR','Classic collar',12,false),
    ('NECK','NECK_KEYHOLE','Keyhole',13,false),
    ('NECK','NECK_MANDARIN_COLLAR','Mandarin collar',14,false),
    ('NECK','NECK_NOTCHED_COLLAR','Notched collar',15,false),
    ('NECK','NECK_PETER_PAN_COLLAR','Peter Pan collar',16,false),
    ('NECK','NECK_ROUND','Round',17,true),
    ('NECK','NECK_SCALLOP_SQUARE','Scallop square',18,false),
    ('NECK','NECK_SCALLOP_V','Scallop V',19,false),
    ('NECK','NECK_SQUARE','Square',20,false),
    ('NECK','NECK_SWEETHEART','Sweetheart',21,false),
    ('NECK','NECK_V','V-neck',22,false),
    ('NECK','NECK_NONE','Built-in neck',23,false),
    ('SLEEVE','BELL','Bell',24,false),
    ('SLEEVE','BISHOP','Bishop',25,false),
    ('SLEEVE','CAP','Cap',26,false),
    ('SLEEVE','FLARED_SLEEVE','Flared',27,false),
    ('SLEEVE','FULL','Full',28,false),
    ('SLEEVE','HALF','Half',29,true),
    ('SLEEVE','NO_SLEEVE','No sleeve',30,false),
    ('SLEEVE','PETAL','Petal',31,false),
    ('SLEEVE','PUFF','Puff',32,false),
    ('KURTI_POCKETS','POCKETS_YES','Yes',33,true),
    ('KURTI_POCKETS','POCKETS_NO','No',34,false),
    ('KNOT_BACK','KNOT_BACK_YES','Yes',35,true),
    ('KNOT_BACK','KNOT_BACK_NO','No',36,false),
    ('KNOT_HIP','KNOT_HIP_YES','Yes',37,true),
    ('KNOT_HIP','KNOT_HIP_NO','No',38,false),
    ('ZIPPER','ZIPPER_YES','Yes',39,false),
    ('ZIPPER','ZIPPER_NO','No',40,true);

  drop table if exists pg_temp._ka;
  create temporary table _ka (grp text, code text, layer text, side text, file text, z int, asset_code text);
  insert into _ka values
    ('STYLE','SHORT_A_LINE','BODY','CENTER','short_kurti2_a_line_body.webp',1,'SHORTKURTI2_BODY_A_LINE'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_a_line_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_A_LINE'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_a_line_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_A_LINE'),
    ('NECK','NECK_KEYHOLE','NECK','CENTER','short_kurti2_a_line_neck_keyhole.webp',3,'SHORTKURTI2_NECK_NECK_KEYHOLE@SHORT_A_LINE'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_a_line_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_A_LINE'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_a_line_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_A_LINE'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_a_line_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_A_LINE'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_a_line_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_A_LINE'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','short_kurti2_a_line_neck_scallop_square.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_SQUARE@SHORT_A_LINE'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','short_kurti2_a_line_neck_scallop_v.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_V@SHORT_A_LINE'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_a_line_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_A_LINE'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','short_kurti2_a_line_neck_sweetheart.webp',3,'SHORTKURTI2_NECK_NECK_SWEETHEART@SHORT_A_LINE'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_a_line_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_A_LINE'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_a_line_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_A_LINE'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_A_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_a_line_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_A_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_A_LINE'),
    ('SLEEVE','CAP','SLEEVE','LEFT','short_kurti2_a_line_sleeve_cap_left.webp',2,'SHORTKURTI2_SLEEVE_L_CAP@SHORT_A_LINE'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_cap_right.webp',2,'SHORTKURTI2_SLEEVE_R_CAP@SHORT_A_LINE'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_a_line_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_A_LINE'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_A_LINE'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_a_line_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_A_LINE'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_A_LINE'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_a_line_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_A_LINE'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_A_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_a_line_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_A_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_A_LINE'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_a_line_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_A_LINE'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_A_LINE'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_a_line_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_A_LINE'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_a_line_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_A_LINE'),
    ('STYLE','SHORT_ANGRAKHA','BODY','CENTER','short_kurti2_angrakha_body.webp',1,'SHORTKURTI2_BODY_ANGRAKHA'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_ANGRAKHA'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_ANGRAKHA'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_ANGRAKHA'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_ANGRAKHA'),
    ('SLEEVE','CAP','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_cap_left.webp',2,'SHORTKURTI2_SLEEVE_L_CAP@SHORT_ANGRAKHA'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_cap_right.webp',2,'SHORTKURTI2_SLEEVE_R_CAP@SHORT_ANGRAKHA'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_ANGRAKHA'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_ANGRAKHA'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_ANGRAKHA'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_ANGRAKHA'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_ANGRAKHA'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_ANGRAKHA'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_ANGRAKHA'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_ANGRAKHA'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_ANGRAKHA'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_ANGRAKHA'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_angrakha_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_ANGRAKHA'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_angrakha_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_ANGRAKHA'),
    ('STYLE','SHORT_EMPIRE_CUT','BODY','CENTER','short_kurti2_empire_cut_body.webp',1,'SHORTKURTI2_BODY_EMPIRE_CUT'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_empire_cut_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_EMPIRE_CUT'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_empire_cut_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_EMPIRE_CUT'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_empire_cut_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_EMPIRE_CUT'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_empire_cut_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_EMPIRE_CUT'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_empire_cut_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_EMPIRE_CUT'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_empire_cut_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_EMPIRE_CUT'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_empire_cut_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_EMPIRE_CUT'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_EMPIRE_CUT'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_EMPIRE_CUT'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_EMPIRE_CUT'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_EMPIRE_CUT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_EMPIRE_CUT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_EMPIRE_CUT'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_EMPIRE_CUT'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_EMPIRE_CUT'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_EMPIRE_CUT'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_EMPIRE_CUT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_EMPIRE_CUT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_EMPIRE_CUT'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_EMPIRE_CUT'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_EMPIRE_CUT'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_empire_cut_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_EMPIRE_CUT'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_empire_cut_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_EMPIRE_CUT'),
    ('STYLE','SHORT_EMPIRE_LINE','BODY','CENTER','short_kurti2_empire_line_body.webp',1,'SHORTKURTI2_BODY_EMPIRE_LINE'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_empire_line_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_empire_line_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_empire_line_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_empire_line_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_empire_line_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_empire_line_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','short_kurti2_empire_line_neck_scallop_square.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_SQUARE@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','short_kurti2_empire_line_neck_scallop_v.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_V@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_empire_line_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','short_kurti2_empire_line_neck_sweetheart.webp',3,'SHORTKURTI2_NECK_NECK_SWEETHEART@SHORT_EMPIRE_LINE'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_empire_line_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_EMPIRE_LINE'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_EMPIRE_LINE'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_EMPIRE_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_EMPIRE_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_EMPIRE_LINE'),
    ('SLEEVE','CAP','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_cap_left.webp',2,'SHORTKURTI2_SLEEVE_L_CAP@SHORT_EMPIRE_LINE'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_cap_right.webp',2,'SHORTKURTI2_SLEEVE_R_CAP@SHORT_EMPIRE_LINE'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_EMPIRE_LINE'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_EMPIRE_LINE'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_EMPIRE_LINE'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_EMPIRE_LINE'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_EMPIRE_LINE'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_EMPIRE_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_EMPIRE_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_EMPIRE_LINE'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_EMPIRE_LINE'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_EMPIRE_LINE'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_empire_line_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_EMPIRE_LINE'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_empire_line_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_EMPIRE_LINE'),
    ('STYLE','SHORT_FLARED','BODY','CENTER','short_kurti2_flared_body.webp',1,'SHORTKURTI2_BODY_FLARED'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_flared_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_FLARED'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_flared_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_FLARED'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_flared_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_FLARED'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_flared_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_FLARED'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_flared_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_FLARED'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','short_kurti2_flared_neck_scallop_square.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_SQUARE@SHORT_FLARED'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','short_kurti2_flared_neck_scallop_v.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_V@SHORT_FLARED'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_flared_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_FLARED'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','short_kurti2_flared_neck_sweetheart.webp',3,'SHORTKURTI2_NECK_NECK_SWEETHEART@SHORT_FLARED'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_flared_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_FLARED'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_flared_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_FLARED'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_flared_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_FLARED'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_flared_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_FLARED'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_flared_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_FLARED'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_flared_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_FLARED'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_flared_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_FLARED'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_flared_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_FLARED'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_flared_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_FLARED'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_flared_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_FLARED'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_flared_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_FLARED'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_flared_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_FLARED'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_flared_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_FLARED'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_flared_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_FLARED'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_flared_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_FLARED'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_flared_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_FLARED'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_flared_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_FLARED'),
    ('STYLE','SHORT_FRONT_SLIT','BODY','CENTER','short_kurti2_front_slit_body.webp',1,'SHORTKURTI2_BODY_FRONT_SLIT'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_front_slit_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_FRONT_SLIT'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_front_slit_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_FRONT_SLIT'),
    ('NECK','NECK_KEYHOLE','NECK','CENTER','short_kurti2_front_slit_neck_keyhole.webp',3,'SHORTKURTI2_NECK_NECK_KEYHOLE@SHORT_FRONT_SLIT'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_front_slit_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_FRONT_SLIT'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_front_slit_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_FRONT_SLIT'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_front_slit_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_FRONT_SLIT'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_front_slit_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_FRONT_SLIT'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','short_kurti2_front_slit_neck_scallop_square.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_SQUARE@SHORT_FRONT_SLIT'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','short_kurti2_front_slit_neck_scallop_v.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_V@SHORT_FRONT_SLIT'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_front_slit_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_FRONT_SLIT'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','short_kurti2_front_slit_neck_sweetheart.webp',3,'SHORTKURTI2_NECK_NECK_SWEETHEART@SHORT_FRONT_SLIT'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_front_slit_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_FRONT_SLIT'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_FRONT_SLIT'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_FRONT_SLIT'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_FRONT_SLIT'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_FRONT_SLIT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_FRONT_SLIT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_FRONT_SLIT'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_FRONT_SLIT'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_FRONT_SLIT'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_FRONT_SLIT'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_FRONT_SLIT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_FRONT_SLIT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_FRONT_SLIT'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_FRONT_SLIT'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_FRONT_SLIT'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_front_slit_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_FRONT_SLIT'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_front_slit_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_FRONT_SLIT'),
    ('STYLE','SHORT_HIGH_LOW','BODY','CENTER','short_kurti2_high_low_body.webp',1,'SHORTKURTI2_BODY_HIGH_LOW'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_high_low_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_HIGH_LOW'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_high_low_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_HIGH_LOW'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_high_low_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_HIGH_LOW'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_high_low_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_HIGH_LOW'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_high_low_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_HIGH_LOW'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_high_low_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_HIGH_LOW'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','short_kurti2_high_low_neck_scallop_square.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_SQUARE@SHORT_HIGH_LOW'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','short_kurti2_high_low_neck_scallop_v.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_V@SHORT_HIGH_LOW'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_high_low_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_HIGH_LOW'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','short_kurti2_high_low_neck_sweetheart.webp',3,'SHORTKURTI2_NECK_NECK_SWEETHEART@SHORT_HIGH_LOW'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_high_low_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_HIGH_LOW'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_high_low_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_HIGH_LOW'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_high_low_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_HIGH_LOW'),
    ('SLEEVE','CAP','SLEEVE','LEFT','short_kurti2_high_low_sleeve_cap_left.webp',2,'SHORTKURTI2_SLEEVE_L_CAP@SHORT_HIGH_LOW'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','short_kurti2_high_low_sleeve_cap_right.webp',2,'SHORTKURTI2_SLEEVE_R_CAP@SHORT_HIGH_LOW'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_high_low_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_HIGH_LOW'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_high_low_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_HIGH_LOW'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_high_low_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_HIGH_LOW'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_high_low_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_HIGH_LOW'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_high_low_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_HIGH_LOW'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_high_low_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_HIGH_LOW'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_high_low_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_HIGH_LOW'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_high_low_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_HIGH_LOW'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_high_low_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_HIGH_LOW'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_high_low_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_HIGH_LOW'),
    ('STYLE','SHORT_PEPLUM','BODY','CENTER','short_kurti2_peplum_body.webp',1,'SHORTKURTI2_BODY_PEPLUM'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_peplum_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_PEPLUM'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_peplum_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_PEPLUM'),
    ('NECK','NECK_KEYHOLE','NECK','CENTER','short_kurti2_peplum_neck_keyhole.webp',3,'SHORTKURTI2_NECK_NECK_KEYHOLE@SHORT_PEPLUM'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_peplum_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_PEPLUM'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_peplum_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_PEPLUM'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_peplum_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_PEPLUM'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_peplum_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_PEPLUM'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','short_kurti2_peplum_neck_scallop_square.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_SQUARE@SHORT_PEPLUM'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','short_kurti2_peplum_neck_scallop_v.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_V@SHORT_PEPLUM'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_peplum_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_PEPLUM'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','short_kurti2_peplum_neck_sweetheart.webp',3,'SHORTKURTI2_NECK_NECK_SWEETHEART@SHORT_PEPLUM'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_peplum_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_PEPLUM'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_peplum_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_PEPLUM'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_PEPLUM'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_peplum_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_PEPLUM'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_PEPLUM'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_peplum_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_PEPLUM'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_PEPLUM'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_peplum_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_PEPLUM'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_PEPLUM'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_peplum_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_PEPLUM'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_PEPLUM'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_peplum_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_PEPLUM'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_PEPLUM'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_peplum_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_PEPLUM'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_PEPLUM'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_peplum_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_PEPLUM'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_peplum_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_PEPLUM'),
    ('STYLE','SHORT_SHIRT','BODY','CENTER','short_kurti2_shirt_body.webp',1,'SHORTKURTI2_BODY_SHIRT'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_shirt_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_SHIRT'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_shirt_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_SHIRT'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_shirt_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_SHIRT'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_shirt_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_SHIRT'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_shirt_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_SHIRT'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_SHIRT'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_shirt_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_SHIRT'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_SHIRT'),
    ('SLEEVE','CAP','SLEEVE','LEFT','short_kurti2_shirt_sleeve_cap_left.webp',2,'SHORTKURTI2_SLEEVE_L_CAP@SHORT_SHIRT'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_cap_right.webp',2,'SHORTKURTI2_SLEEVE_R_CAP@SHORT_SHIRT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_shirt_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_SHIRT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_SHIRT'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_shirt_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_SHIRT'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_SHIRT'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_shirt_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_SHIRT'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_SHIRT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_shirt_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_SHIRT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_SHIRT'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_shirt_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_SHIRT'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_SHIRT'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_shirt_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_SHIRT'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_shirt_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_SHIRT'),
    ('STYLE','SHORT_STRAIGHT','BODY','CENTER','short_kurti2_straight_body.webp',1,'SHORTKURTI2_BODY_STRAIGHT'),
    ('NECK','NECK_BOAT','NECK','CENTER','short_kurti2_straight_neck_boat.webp',3,'SHORTKURTI2_NECK_NECK_BOAT@SHORT_STRAIGHT'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','short_kurti2_straight_neck_classic.webp',3,'SHORTKURTI2_NECK_NECK_CLASSIC_COLLAR@SHORT_STRAIGHT'),
    ('NECK','NECK_KEYHOLE','NECK','CENTER','short_kurti2_straight_neck_keyhole.webp',3,'SHORTKURTI2_NECK_NECK_KEYHOLE@SHORT_STRAIGHT'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','short_kurti2_straight_neck_mandarin.webp',3,'SHORTKURTI2_NECK_NECK_MANDARIN_COLLAR@SHORT_STRAIGHT'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','short_kurti2_straight_neck_notched.webp',3,'SHORTKURTI2_NECK_NECK_NOTCHED_COLLAR@SHORT_STRAIGHT'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','short_kurti2_straight_neck_peter_pan.webp',3,'SHORTKURTI2_NECK_NECK_PETER_PAN_COLLAR@SHORT_STRAIGHT'),
    ('NECK','NECK_ROUND','NECK','CENTER','short_kurti2_straight_neck_round.webp',3,'SHORTKURTI2_NECK_NECK_ROUND@SHORT_STRAIGHT'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','short_kurti2_straight_neck_scallop_square.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_SQUARE@SHORT_STRAIGHT'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','short_kurti2_straight_neck_scallop_v.webp',3,'SHORTKURTI2_NECK_NECK_SCALLOP_V@SHORT_STRAIGHT'),
    ('NECK','NECK_SQUARE','NECK','CENTER','short_kurti2_straight_neck_square.webp',3,'SHORTKURTI2_NECK_NECK_SQUARE@SHORT_STRAIGHT'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','short_kurti2_straight_neck_sweetheart.webp',3,'SHORTKURTI2_NECK_NECK_SWEETHEART@SHORT_STRAIGHT'),
    ('NECK','NECK_V','NECK','CENTER','short_kurti2_straight_neck_v.webp',3,'SHORTKURTI2_NECK_NECK_V@SHORT_STRAIGHT'),
    ('SLEEVE','BELL','SLEEVE','LEFT','short_kurti2_straight_sleeve_bell_left.webp',2,'SHORTKURTI2_SLEEVE_L_BELL@SHORT_STRAIGHT'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','short_kurti2_straight_sleeve_bell_right.webp',2,'SHORTKURTI2_SLEEVE_R_BELL@SHORT_STRAIGHT'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','short_kurti2_straight_sleeve_bishop_left.webp',2,'SHORTKURTI2_SLEEVE_L_BISHOP@SHORT_STRAIGHT'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','short_kurti2_straight_sleeve_bishop_right.webp',2,'SHORTKURTI2_SLEEVE_R_BISHOP@SHORT_STRAIGHT'),
    ('SLEEVE','CAP','SLEEVE','LEFT','short_kurti2_straight_sleeve_cap_left.webp',2,'SHORTKURTI2_SLEEVE_L_CAP@SHORT_STRAIGHT'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','short_kurti2_straight_sleeve_cap_right.webp',2,'SHORTKURTI2_SLEEVE_R_CAP@SHORT_STRAIGHT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','LEFT','short_kurti2_straight_sleeve_flarred_left.webp',2,'SHORTKURTI2_SLEEVE_L_FLARED_SLEEVE@SHORT_STRAIGHT'),
    ('SLEEVE','FLARED_SLEEVE','SLEEVE','RIGHT','short_kurti2_straight_sleeve_flarred_right.webp',2,'SHORTKURTI2_SLEEVE_R_FLARED_SLEEVE@SHORT_STRAIGHT'),
    ('SLEEVE','FULL','SLEEVE','LEFT','short_kurti2_straight_sleeve_full_left.webp',2,'SHORTKURTI2_SLEEVE_L_FULL@SHORT_STRAIGHT'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','short_kurti2_straight_sleeve_full_right.webp',2,'SHORTKURTI2_SLEEVE_R_FULL@SHORT_STRAIGHT'),
    ('SLEEVE','HALF','SLEEVE','LEFT','short_kurti2_straight_sleeve_half_left.webp',2,'SHORTKURTI2_SLEEVE_L_HALF@SHORT_STRAIGHT'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','short_kurti2_straight_sleeve_half_right.webp',2,'SHORTKURTI2_SLEEVE_R_HALF@SHORT_STRAIGHT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','short_kurti2_straight_sleeve_no_left.webp',2,'SHORTKURTI2_SLEEVE_L_NO_SLEEVE@SHORT_STRAIGHT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','short_kurti2_straight_sleeve_no_right.webp',2,'SHORTKURTI2_SLEEVE_R_NO_SLEEVE@SHORT_STRAIGHT'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','short_kurti2_straight_sleeve_petal_left.webp',2,'SHORTKURTI2_SLEEVE_L_PETAL@SHORT_STRAIGHT'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','short_kurti2_straight_sleeve_petal_right.webp',2,'SHORTKURTI2_SLEEVE_R_PETAL@SHORT_STRAIGHT'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','short_kurti2_straight_sleeve_puff_left.webp',2,'SHORTKURTI2_SLEEVE_L_PUFF@SHORT_STRAIGHT'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','short_kurti2_straight_sleeve_puff_right.webp',2,'SHORTKURTI2_SLEEVE_R_PUFF@SHORT_STRAIGHT');

  drop table if exists pg_temp._kc;
  create temporary table _kc (grp text, code text, cost numeric, fabric numeric);
  insert into _kc values
    ('STYLE','SHORT_STRAIGHT',0,0),
    ('STYLE','SHORT_A_LINE',30,0.2),
    ('STYLE','SHORT_EMPIRE_LINE',40,0.3),
    ('STYLE','SHORT_EMPIRE_CUT',40,0.3),
    ('STYLE','SHORT_ANGRAKHA',60,0.5),
    ('STYLE','SHORT_FLARED',60,0.5),
    ('STYLE','SHORT_FRONT_SLIT',25,0.05),
    ('STYLE','SHORT_HIGH_LOW',40,0.3),
    ('STYLE','SHORT_PEPLUM',50,0.35),
    ('STYLE','SHORT_SHIRT',20,0.1),
    ('NECK','NECK_BOAT',20,0.03),
    ('NECK','NECK_CLASSIC_COLLAR',25,0.02),
    ('NECK','NECK_KEYHOLE',15,0.02),
    ('NECK','NECK_MANDARIN_COLLAR',20,0.02),
    ('NECK','NECK_NOTCHED_COLLAR',30,0.03),
    ('NECK','NECK_PETER_PAN_COLLAR',30,0.03),
    ('NECK','NECK_ROUND',10,0),
    ('NECK','NECK_SCALLOP_SQUARE',45,0.05),
    ('NECK','NECK_SCALLOP_V',45,0.05),
    ('NECK','NECK_SQUARE',20,0.03),
    ('NECK','NECK_SWEETHEART',40,0.05),
    ('NECK','NECK_V',10,0),
    ('NECK','NECK_NONE',0,0),
    ('SLEEVE','BELL',30,0.5),
    ('SLEEVE','BISHOP',35,0.6),
    ('SLEEVE','CAP',0,0.1),
    ('SLEEVE','FLARED_SLEEVE',30,0.45),
    ('SLEEVE','FULL',0,0.55),
    ('SLEEVE','HALF',0,0.25),
    ('SLEEVE','NO_SLEEVE',0,0),
    ('SLEEVE','PETAL',20,0.25),
    ('SLEEVE','PUFF',20,0.3),
    ('KURTI_POCKETS','POCKETS_YES',30,0.05),
    ('KURTI_POCKETS','POCKETS_NO',0,0),
    ('KNOT_BACK','KNOT_BACK_YES',20,0.05),
    ('KNOT_BACK','KNOT_BACK_NO',0,0),
    ('KNOT_HIP','KNOT_HIP_YES',20,0.05),
    ('KNOT_HIP','KNOT_HIP_NO',0,0),
    ('ZIPPER','ZIPPER_YES',40,0.03),
    ('ZIPPER','ZIPPER_NO',0,0);

  -- ---------- 1. old pictures and old choices go away ----------
  delete from public.option_value_asset_map where asset_set_id = v_set;
  begin
    delete from public.customizer_asset where asset_set_id = v_set;
  exception when others then
    update public.customizer_asset set is_active = false where asset_set_id = v_set;
  end;

  -- style / neck / sleeve values the kurti no longer offers
  delete from public.garment_option_value_map m
  using public.option_value_master ov, public.option_group_master g
  where m.garment_id = v_g and ov.id = m.option_value_id and g.id = ov.option_group_id
    and g.option_group_code in ('STYLE','NECK','SLEEVE')
    and ov.option_value_code not in (select code from _kv where grp = g.option_group_code);

  delete from public.product_option_value_map m
  using public.option_value_master ov, public.option_group_master g
  where m.product_id = v_p and ov.id = m.option_value_id and g.id = ov.option_group_id
    and g.option_group_code in ('STYLE','NECK','SLEEVE')
    and ov.option_value_code not in (select code from _kv where grp = g.option_group_code);

  -- ---------- 2. option values ----------
  insert into public.option_value_master (option_group_id, option_value_code, option_value_name, is_active, sort_order)
  select g.id, v.code, v.name, true, 200 + v.ord
  from _kv v join public.option_group_master g on g.option_group_code = v.grp
  where not exists (
    select 1 from public.option_value_master x where x.option_group_id = g.id and x.option_value_code = v.code);

  insert into public.garment_option_value_map (garment_id, option_value_id, is_active, sort_order)
  select v_g, ov.id, true, v.ord
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where not exists (select 1 from public.garment_option_value_map m where m.garment_id = v_g and m.option_value_id = ov.id);

  update public.garment_option_value_map m set sort_order = v.ord, is_active = true
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where m.garment_id = v_g and m.option_value_id = ov.id;

  -- product: allowed values + the starting look
  insert into public.product_option_value_map (product_id, option_group_id, option_value_id, is_default, is_active)
  select v_p, g.id, ov.id, v.is_default, true
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where not exists (select 1 from public.product_option_value_map x where x.product_id = v_p and x.option_value_id = ov.id);

  update public.product_option_value_map m set is_default = v.is_default, is_active = true
  from _kv v
  join public.option_group_master g on g.option_group_code = v.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = v.code
  where m.product_id = v_p and m.option_value_id = ov.id;

  -- ---------- 3. pictures ----------
  insert into public.customizer_asset
    (asset_set_id, asset_code, asset_name, asset_group, asset_side, file_key, width, height, z_index, is_active, is_base_asset)
  select v_set, a.asset_code, 'Short Kurti - ' || a.layer || ' - ' || a.asset_code, a.layer, a.side,
         'short_kurti/v2/' || a.file, 768, 1024, a.z, true, false
  from _ka a
  where not exists (select 1 from public.customizer_asset c where c.asset_code = a.asset_code);

  insert into public.option_value_asset_map (asset_set_id, option_value_id, customizer_asset_id, is_active, sort_order)
  select v_set, ov.id, ca.id, true, 1
  from _ka a
  join public.option_group_master g on g.option_group_code = a.grp
  join public.option_value_master ov on ov.option_group_id = g.id and ov.option_value_code = a.code
  join public.customizer_asset ca on ca.asset_code = a.asset_code
  where not exists (
    select 1 from public.option_value_asset_map m
    where m.asset_set_id = v_set and m.option_value_id = ov.id and m.customizer_asset_id = ca.id);

  -- ---------- 4. PLACEHOLDER COSTS for new values (existing ones are kept) ----------
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
