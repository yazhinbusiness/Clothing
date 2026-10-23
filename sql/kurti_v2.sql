-- =============================================================
-- KURTI v2  (run once in the Supabase SQL editor; safe to re-run)
-- Run AFTER sql/pants.sql and sql/kurti.sql (it replaces the first kurti setup).
--
-- Rebuilds the KURTI garment for the new picture set:
--   * 8 styles, each with its OWN neck and sleeve pictures
--     (A-line, Anarkali, Angrakha, Empire cut, High-low, Kaftan, Shirt kurti, Straight)
--   * a neck / sleeve picture is tagged "@<STYLE>" in its asset_code and is only
--     shown (and only offered) for that style; Kaftan has no sleeve pictures
--   * Pockets, Knot at back, Knot at hip, Zipper change the PRICE only
--   * ALL NEW COSTS ARE PLACEHOLDERS - existing kurti costs are kept as they are
-- =============================================================

do $$
declare
  v_g uuid;
  v_pb uuid;
  v_p uuid;
  v_set uuid;
begin
  v_g := (select id from public.garment_master where garment_code = 'KURTI');
  if v_g is null then
    raise exception 'Run sql/kurti.sql first (garment KURTI not found)';
  end if;
  v_pb := (select id from public.price_book_master where price_book_code = 'PB_2026_01');
  v_p := (select id from public.product_master where product_code = 'COTTON_KURTI');
  v_set := (select id from public.asset_set_master where asset_set_code = 'KURTI_FRONT_V1');

  drop table if exists pg_temp._kv;
  create temporary table _kv (grp text, code text, name text, ord int, is_default boolean);
  insert into _kv values
    ('STYLE','KURTI_STRAIGHT','Straight',1,true),
    ('STYLE','KURTI_A_LINE','A-line',2,false),
    ('STYLE','KURTI_ANARKALI','Anarkali',3,false),
    ('STYLE','KURTI_ANGRAKHA','Angrakha',4,false),
    ('STYLE','KURTI_EMPIRE_LINE','Empire cut',5,false),
    ('STYLE','KURTI_HIGH_LOW','High-low',6,false),
    ('STYLE','KURTI_KAFTAN','Kaftan',7,false),
    ('STYLE','KURTI_SHIRT','Shirt kurti',8,false),
    ('NECK','NECK_BOAT','Boat',9,false),
    ('NECK','NECK_CLASSIC_COLLAR','Classic collar',10,true),
    ('NECK','NECK_MANDARIN_COLLAR','Mandarin collar',11,false),
    ('NECK','NECK_NOTCHED_COLLAR','Notched collar',12,false),
    ('NECK','NECK_PETER_PAN_COLLAR','Peter Pan collar',13,false),
    ('NECK','NECK_ROUND','Round',14,false),
    ('NECK','NECK_SCALLOP_SQUARE','Scallop square',15,false),
    ('NECK','NECK_SCALLOP_V','Scallop V',16,false),
    ('NECK','NECK_SQUARE','Square',17,false),
    ('NECK','NECK_SWEETHEART','Sweetheart',18,false),
    ('NECK','NECK_V','V-neck',19,false),
    ('SLEEVE','BELL','Bell',20,false),
    ('SLEEVE','BISHOP','Bishop',21,false),
    ('SLEEVE','CAP','Cap',22,false),
    ('SLEEVE','FULL','Full',23,false),
    ('SLEEVE','HALF','Half',24,true),
    ('SLEEVE','NO_SLEEVE','No sleeve',25,false),
    ('SLEEVE','PETAL','Petal',26,false),
    ('SLEEVE','PUFF','Puff',27,false),
    ('KURTI_POCKETS','POCKETS_YES','Yes',28,true),
    ('KURTI_POCKETS','POCKETS_NO','No',29,false),
    ('KNOT_BACK','KNOT_BACK_YES','Yes',30,true),
    ('KNOT_BACK','KNOT_BACK_NO','No',31,false),
    ('KNOT_HIP','KNOT_HIP_YES','Yes',32,true),
    ('KNOT_HIP','KNOT_HIP_NO','No',33,false),
    ('ZIPPER','ZIPPER_YES','Yes',34,false),
    ('ZIPPER','ZIPPER_NO','No',35,true);

  drop table if exists pg_temp._ka;
  create temporary table _ka (grp text, code text, layer text, side text, file text, z int, asset_code text);
  insert into _ka values
    ('SLEEVE','BELL','SLEEVE','LEFT','kurti2_a_line_sleeve_bell_left.webp',2,'KURTI2_SLEEVE_L_BELL@KURTI_A_LINE'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','kurti2_a_line_sleeve_bell_right.webp',2,'KURTI2_SLEEVE_R_BELL@KURTI_A_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','kurti2_a_line_sleeve_bishop_left.webp',2,'KURTI2_SLEEVE_L_BISHOP@KURTI_A_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','kurti2_a_line_sleeve_bishop_right.webp',2,'KURTI2_SLEEVE_R_BISHOP@KURTI_A_LINE'),
    ('NECK','NECK_BOAT','NECK','CENTER','kurti2_a_line_neck_boat.webp',3,'KURTI2_NECK_NECK_BOAT@KURTI_A_LINE'),
    ('SLEEVE','CAP','SLEEVE','LEFT','kurti2_a_line_sleeve_cap_left.webp',2,'KURTI2_SLEEVE_L_CAP@KURTI_A_LINE'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','kurti2_a_line_sleeve_cap_right.webp',2,'KURTI2_SLEEVE_R_CAP@KURTI_A_LINE'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_a_line_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_A_LINE'),
    ('SLEEVE','HALF','SLEEVE','LEFT','kurti2_a_line_sleeve_half_left.webp',2,'KURTI2_SLEEVE_L_HALF@KURTI_A_LINE'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','kurti2_a_line_sleeve_half_right.webp',2,'KURTI2_SLEEVE_R_HALF@KURTI_A_LINE'),
    ('STYLE','KURTI_A_LINE','BODY','CENTER','kurti2_a_line_body.webp',1,'KURTI2_BODY_A_LINE'),
    ('SLEEVE','FULL','SLEEVE','LEFT','kurti2_a_line_sleeve_full_left.webp',2,'KURTI2_SLEEVE_L_FULL@KURTI_A_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','kurti2_a_line_sleeve_no_left.webp',2,'KURTI2_SLEEVE_L_NO_SLEEVE@KURTI_A_LINE'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_a_line_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_A_LINE'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_a_line_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_A_LINE'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','kurti2_a_line_sleeve_petal_left.webp',2,'KURTI2_SLEEVE_L_PETAL@KURTI_A_LINE'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','kurti2_a_line_sleeve_petal_right.webp',2,'KURTI2_SLEEVE_R_PETAL@KURTI_A_LINE'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_a_line_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_A_LINE'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','kurti2_a_line_sleeve_puff_left.webp',2,'KURTI2_SLEEVE_L_PUFF@KURTI_A_LINE'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','kurti2_a_line_sleeve_puff_right.webp',2,'KURTI2_SLEEVE_R_PUFF@KURTI_A_LINE'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','kurti2_a_line_sleeve_full_right.webp',2,'KURTI2_SLEEVE_R_FULL@KURTI_A_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','kurti2_a_line_sleeve_no_right.webp',2,'KURTI2_SLEEVE_R_NO_SLEEVE@KURTI_A_LINE'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_a_line_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_A_LINE'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','kurti2_a_line_neck_scallop_square.webp',3,'KURTI2_NECK_NECK_SCALLOP_SQUARE@KURTI_A_LINE'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','kurti2_a_line_neck_scallop_v.webp',3,'KURTI2_NECK_NECK_SCALLOP_V@KURTI_A_LINE'),
    ('NECK','NECK_SQUARE','NECK','CENTER','kurti2_a_line_neck_square.webp',3,'KURTI2_NECK_NECK_SQUARE@KURTI_A_LINE'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','kurti2_a_line_neck_sweetheart.webp',3,'KURTI2_NECK_NECK_SWEETHEART@KURTI_A_LINE'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_a_line_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_A_LINE'),
    ('NECK','NECK_BOAT','NECK','CENTER','kurti2_anarkali_neck_boat.webp',3,'KURTI2_NECK_NECK_BOAT@KURTI_ANARKALI'),
    ('STYLE','KURTI_ANARKALI','BODY','CENTER','kurti2_anarkali_body.webp',1,'KURTI2_BODY_ANARKALI'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_anarkali_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_ANARKALI'),
    ('SLEEVE','BELL','SLEEVE','LEFT','kurti2_anarkali_sleeve_bell_left.webp',2,'KURTI2_SLEEVE_L_BELL@KURTI_ANARKALI'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','kurti2_anarkali_sleeve_bishop_left.webp',2,'KURTI2_SLEEVE_L_BISHOP@KURTI_ANARKALI'),
    ('SLEEVE','CAP','SLEEVE','LEFT','kurti2_anarkali_sleeve_cap_left.webp',2,'KURTI2_SLEEVE_L_CAP@KURTI_ANARKALI'),
    ('SLEEVE','FULL','SLEEVE','LEFT','kurti2_anarkali_sleeve_full_left.webp',2,'KURTI2_SLEEVE_L_FULL@KURTI_ANARKALI'),
    ('SLEEVE','HALF','SLEEVE','LEFT','kurti2_anarkali_sleeve_half_left.webp',2,'KURTI2_SLEEVE_L_HALF@KURTI_ANARKALI'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','kurti2_anarkali_sleeve_no_left.webp',2,'KURTI2_SLEEVE_L_NO_SLEEVE@KURTI_ANARKALI'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','kurti2_anarkali_sleeve_petal_left.webp',2,'KURTI2_SLEEVE_L_PETAL@KURTI_ANARKALI'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','kurti2_anarkali_sleeve_puff_left.webp',2,'KURTI2_SLEEVE_L_PUFF@KURTI_ANARKALI'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_anarkali_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_ANARKALI'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_anarkali_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_ANARKALI'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_anarkali_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_ANARKALI'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','kurti2_anarkali_sleeve_bell_right.webp',2,'KURTI2_SLEEVE_R_BELL@KURTI_ANARKALI'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','kurti2_anarkali_sleeve_bishop_right.webp',2,'KURTI2_SLEEVE_R_BISHOP@KURTI_ANARKALI'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','kurti2_anarkali_sleeve_cap_right.webp',2,'KURTI2_SLEEVE_R_CAP@KURTI_ANARKALI'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','kurti2_anarkali_sleeve_full_right.webp',2,'KURTI2_SLEEVE_R_FULL@KURTI_ANARKALI'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','kurti2_anarkali_sleeve_half_right.webp',2,'KURTI2_SLEEVE_R_HALF@KURTI_ANARKALI'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','kurti2_anarkali_sleeve_no_right.webp',2,'KURTI2_SLEEVE_R_NO_SLEEVE@KURTI_ANARKALI'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','kurti2_anarkali_sleeve_petal_right.webp',2,'KURTI2_SLEEVE_R_PETAL@KURTI_ANARKALI'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','kurti2_anarkali_sleeve_puff_right.webp',2,'KURTI2_SLEEVE_R_PUFF@KURTI_ANARKALI'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_anarkali_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_ANARKALI'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','kurti2_anarkali_neck_scallop_square.webp',3,'KURTI2_NECK_NECK_SCALLOP_SQUARE@KURTI_ANARKALI'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','kurti2_anarkali_neck_scallop_v.webp',3,'KURTI2_NECK_NECK_SCALLOP_V@KURTI_ANARKALI'),
    ('NECK','NECK_SQUARE','NECK','CENTER','kurti2_anarkali_neck_square.webp',3,'KURTI2_NECK_NECK_SQUARE@KURTI_ANARKALI'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','kurti2_anarkali_neck_sweetheart.webp',3,'KURTI2_NECK_NECK_SWEETHEART@KURTI_ANARKALI'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_anarkali_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_ANARKALI'),
    ('STYLE','KURTI_ANGRAKHA','BODY','CENTER','kurti2_angrakha_body.webp',1,'KURTI2_BODY_ANGRAKHA'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_angrakha_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_ANGRAKHA'),
    ('SLEEVE','BELL','SLEEVE','LEFT','kurti2_angrakha_sleeve_bell_left.webp',2,'KURTI2_SLEEVE_L_BELL@KURTI_ANGRAKHA'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','kurti2_angrakha_sleeve_bishop_left.webp',2,'KURTI2_SLEEVE_L_BISHOP@KURTI_ANGRAKHA'),
    ('SLEEVE','CAP','SLEEVE','LEFT','kurti2_angrakha_sleeve_cap_left.webp',2,'KURTI2_SLEEVE_L_CAP@KURTI_ANGRAKHA'),
    ('SLEEVE','FULL','SLEEVE','LEFT','kurti2_angrakha_sleeve_full_left.webp',2,'KURTI2_SLEEVE_L_FULL@KURTI_ANGRAKHA'),
    ('SLEEVE','HALF','SLEEVE','LEFT','kurti2_angrakha_sleeve_half_left.webp',2,'KURTI2_SLEEVE_L_HALF@KURTI_ANGRAKHA'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','kurti2_angrakha_sleeve_no_left.webp',2,'KURTI2_SLEEVE_L_NO_SLEEVE@KURTI_ANGRAKHA'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','kurti2_angrakha_sleeve_petal_left.webp',2,'KURTI2_SLEEVE_L_PETAL@KURTI_ANGRAKHA'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','kurti2_angrakha_sleeve_puff_left.webp',2,'KURTI2_SLEEVE_L_PUFF@KURTI_ANGRAKHA'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_angrakha_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_ANGRAKHA'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_angrakha_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_ANGRAKHA'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_angrakha_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_ANGRAKHA'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','kurti2_angrakha_sleeve_bell_right.webp',2,'KURTI2_SLEEVE_R_BELL@KURTI_ANGRAKHA'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','kurti2_angrakha_sleeve_bishop_right.webp',2,'KURTI2_SLEEVE_R_BISHOP@KURTI_ANGRAKHA'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','kurti2_angrakha_sleeve_cap_right.webp',2,'KURTI2_SLEEVE_R_CAP@KURTI_ANGRAKHA'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','kurti2_angrakha_sleeve_full_right.webp',2,'KURTI2_SLEEVE_R_FULL@KURTI_ANGRAKHA'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','kurti2_angrakha_sleeve_half_right.webp',2,'KURTI2_SLEEVE_R_HALF@KURTI_ANGRAKHA'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','kurti2_angrakha_sleeve_no_right.webp',2,'KURTI2_SLEEVE_R_NO_SLEEVE@KURTI_ANGRAKHA'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','kurti2_angrakha_sleeve_petal_right.webp',2,'KURTI2_SLEEVE_R_PETAL@KURTI_ANGRAKHA'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','kurti2_angrakha_sleeve_puff_right.webp',2,'KURTI2_SLEEVE_R_PUFF@KURTI_ANGRAKHA'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_angrakha_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_ANGRAKHA'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','kurti2_angrakha_neck_scallop_square.webp',3,'KURTI2_NECK_NECK_SCALLOP_SQUARE@KURTI_ANGRAKHA'),
    ('NECK','NECK_SQUARE','NECK','CENTER','kurti2_angrakha_neck_square.webp',3,'KURTI2_NECK_NECK_SQUARE@KURTI_ANGRAKHA'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','kurti2_angrakha_neck_sweetheart.webp',3,'KURTI2_NECK_NECK_SWEETHEART@KURTI_ANGRAKHA'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_angrakha_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_ANGRAKHA'),
    ('STYLE','KURTI_EMPIRE_LINE','BODY','CENTER','kurti2_empire_cut_body.webp',1,'KURTI2_BODY_EMPIRE_CUT'),
    ('NECK','NECK_BOAT','NECK','CENTER','kurti2_empire_cut_neck_boat.webp',3,'KURTI2_NECK_NECK_BOAT@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_empire_cut_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_EMPIRE_LINE'),
    ('SLEEVE','BELL','SLEEVE','LEFT','kurti2_empire_cut_sleeve_bell_left.webp',2,'KURTI2_SLEEVE_L_BELL@KURTI_EMPIRE_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','kurti2_empire_cut_sleeve_bishop_left.webp',2,'KURTI2_SLEEVE_L_BISHOP@KURTI_EMPIRE_LINE'),
    ('SLEEVE','CAP','SLEEVE','LEFT','kurti2_empire_cut_sleeve_cap_left.webp',2,'KURTI2_SLEEVE_L_CAP@KURTI_EMPIRE_LINE'),
    ('SLEEVE','FULL','SLEEVE','LEFT','kurti2_empire_cut_sleeve_full_left.webp',2,'KURTI2_SLEEVE_L_FULL@KURTI_EMPIRE_LINE'),
    ('SLEEVE','HALF','SLEEVE','LEFT','kurti2_empire_cut_sleeve_half_left.webp',2,'KURTI2_SLEEVE_L_HALF@KURTI_EMPIRE_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','kurti2_empire_cut_sleeve_no_left.webp',2,'KURTI2_SLEEVE_L_NO_SLEEVE@KURTI_EMPIRE_LINE'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','kurti2_empire_cut_sleeve_petal_left.webp',2,'KURTI2_SLEEVE_L_PETAL@KURTI_EMPIRE_LINE'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','kurti2_empire_cut_sleeve_puff_left.webp',2,'KURTI2_SLEEVE_L_PUFF@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_empire_cut_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_empire_cut_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_empire_cut_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_EMPIRE_LINE'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_bell_right.webp',2,'KURTI2_SLEEVE_R_BELL@KURTI_EMPIRE_LINE'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_bishop_right.webp',2,'KURTI2_SLEEVE_R_BISHOP@KURTI_EMPIRE_LINE'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_cap_right.webp',2,'KURTI2_SLEEVE_R_CAP@KURTI_EMPIRE_LINE'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_full_right.webp',2,'KURTI2_SLEEVE_R_FULL@KURTI_EMPIRE_LINE'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_half_right.webp',2,'KURTI2_SLEEVE_R_HALF@KURTI_EMPIRE_LINE'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_no_right.webp',2,'KURTI2_SLEEVE_R_NO_SLEEVE@KURTI_EMPIRE_LINE'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_petal_right.webp',2,'KURTI2_SLEEVE_R_PETAL@KURTI_EMPIRE_LINE'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','kurti2_empire_cut_sleeve_puff_right.webp',2,'KURTI2_SLEEVE_R_PUFF@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_empire_cut_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','kurti2_empire_cut_neck_scallop_square.webp',3,'KURTI2_NECK_NECK_SCALLOP_SQUARE@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','kurti2_empire_cut_neck_scallop_v.webp',3,'KURTI2_NECK_NECK_SCALLOP_V@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_SQUARE','NECK','CENTER','kurti2_empire_cut_neck_square.webp',3,'KURTI2_NECK_NECK_SQUARE@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','kurti2_empire_cut_neck_sweetheart.webp',3,'KURTI2_NECK_NECK_SWEETHEART@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_empire_cut_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_EMPIRE_LINE'),
    ('NECK','NECK_BOAT','NECK','CENTER','kurti2_high_low_neck_boat.webp',3,'KURTI2_NECK_NECK_BOAT@KURTI_HIGH_LOW'),
    ('STYLE','KURTI_HIGH_LOW','BODY','CENTER','kurti2_high_low_body.webp',1,'KURTI2_BODY_HIGH_LOW'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_high_low_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_HIGH_LOW'),
    ('SLEEVE','BELL','SLEEVE','LEFT','kurti2_high_low_sleeve_bell_left.webp',2,'KURTI2_SLEEVE_L_BELL@KURTI_HIGH_LOW'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','kurti2_high_low_sleeve_bishop_left.webp',2,'KURTI2_SLEEVE_L_BISHOP@KURTI_HIGH_LOW'),
    ('SLEEVE','CAP','SLEEVE','LEFT','kurti2_high_low_sleeve_cap_left.webp',2,'KURTI2_SLEEVE_L_CAP@KURTI_HIGH_LOW'),
    ('SLEEVE','FULL','SLEEVE','LEFT','kurti2_high_low_sleeve_full_left.webp',2,'KURTI2_SLEEVE_L_FULL@KURTI_HIGH_LOW'),
    ('SLEEVE','HALF','SLEEVE','LEFT','kurti2_high_low_sleeve_half_left.webp',2,'KURTI2_SLEEVE_L_HALF@KURTI_HIGH_LOW'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','kurti2_high_low_sleeve_no_left.webp',2,'KURTI2_SLEEVE_L_NO_SLEEVE@KURTI_HIGH_LOW'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','kurti2_high_low_sleeve_petal_left.webp',2,'KURTI2_SLEEVE_L_PETAL@KURTI_HIGH_LOW'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','kurti2_high_low_sleeve_puff_left.webp',2,'KURTI2_SLEEVE_L_PUFF@KURTI_HIGH_LOW'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_high_low_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_HIGH_LOW'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_high_low_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_HIGH_LOW'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_high_low_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_HIGH_LOW'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','kurti2_high_low_sleeve_bell_right.webp',2,'KURTI2_SLEEVE_R_BELL@KURTI_HIGH_LOW'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','kurti2_high_low_sleeve_bishop_right.webp',2,'KURTI2_SLEEVE_R_BISHOP@KURTI_HIGH_LOW'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','kurti2_high_low_sleeve_cap_right.webp',2,'KURTI2_SLEEVE_R_CAP@KURTI_HIGH_LOW'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','kurti2_high_low_sleeve_full_right.webp',2,'KURTI2_SLEEVE_R_FULL@KURTI_HIGH_LOW'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','kurti2_high_low_sleeve_half_right.webp',2,'KURTI2_SLEEVE_R_HALF@KURTI_HIGH_LOW'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','kurti2_high_low_sleeve_no_right.webp',2,'KURTI2_SLEEVE_R_NO_SLEEVE@KURTI_HIGH_LOW'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','kurti2_high_low_sleeve_petal_right.webp',2,'KURTI2_SLEEVE_R_PETAL@KURTI_HIGH_LOW'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','kurti2_high_low_sleeve_puff_right.webp',2,'KURTI2_SLEEVE_R_PUFF@KURTI_HIGH_LOW'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_high_low_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_HIGH_LOW'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','kurti2_high_low_neck_scallop_square.webp',3,'KURTI2_NECK_NECK_SCALLOP_SQUARE@KURTI_HIGH_LOW'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','kurti2_high_low_neck_scallop_v.webp',3,'KURTI2_NECK_NECK_SCALLOP_V@KURTI_HIGH_LOW'),
    ('NECK','NECK_SQUARE','NECK','CENTER','kurti2_high_low_neck_square.webp',3,'KURTI2_NECK_NECK_SQUARE@KURTI_HIGH_LOW'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','kurti2_high_low_neck_sweetheart.webp',3,'KURTI2_NECK_NECK_SWEETHEART@KURTI_HIGH_LOW'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_high_low_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_HIGH_LOW'),
    ('NECK','NECK_BOAT','NECK','CENTER','kurti2_kaftan_neck_boat.webp',3,'KURTI2_NECK_NECK_BOAT@KURTI_KAFTAN'),
    ('STYLE','KURTI_KAFTAN','BODY','CENTER','kurti2_kaftan_body.webp',1,'KURTI2_BODY_KAFTAN'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_kaftan_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_KAFTAN'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_kaftan_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_KAFTAN'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_kaftan_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_KAFTAN'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_kaftan_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_KAFTAN'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_kaftan_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_KAFTAN'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','kurti2_kaftan_neck_scallop_square.webp',3,'KURTI2_NECK_NECK_SCALLOP_SQUARE@KURTI_KAFTAN'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','kurti2_kaftan_neck_scallop_v.webp',3,'KURTI2_NECK_NECK_SCALLOP_V@KURTI_KAFTAN'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','kurti2_kaftan_neck_sweetheart.webp',3,'KURTI2_NECK_NECK_SWEETHEART@KURTI_KAFTAN'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_kaftan_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_KAFTAN'),
    ('NECK','NECK_BOAT','NECK','CENTER','kurti2_shirt_neck_boat.webp',3,'KURTI2_NECK_NECK_BOAT@KURTI_SHIRT'),
    ('STYLE','KURTI_SHIRT','BODY','CENTER','kurti2_shirt_body.webp',1,'KURTI2_BODY_SHIRT'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_shirt_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_SHIRT'),
    ('SLEEVE','BELL','SLEEVE','LEFT','kurti2_shirt_sleeve_bell_left.webp',2,'KURTI2_SLEEVE_L_BELL@KURTI_SHIRT'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','kurti2_shirt_sleeve_bishop_left.webp',2,'KURTI2_SLEEVE_L_BISHOP@KURTI_SHIRT'),
    ('SLEEVE','CAP','SLEEVE','LEFT','kurti2_shirt_sleeve_cap_left.webp',2,'KURTI2_SLEEVE_L_CAP@KURTI_SHIRT'),
    ('SLEEVE','FULL','SLEEVE','LEFT','kurti2_shirt_sleeve_full_left.webp',2,'KURTI2_SLEEVE_L_FULL@KURTI_SHIRT'),
    ('SLEEVE','HALF','SLEEVE','LEFT','kurti2_shirt_sleeve_half_left.webp',2,'KURTI2_SLEEVE_L_HALF@KURTI_SHIRT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','kurti2_shirt_sleeve_no_left.webp',2,'KURTI2_SLEEVE_L_NO_SLEEVE@KURTI_SHIRT'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','kurti2_shirt_sleeve_petal_left.webp',2,'KURTI2_SLEEVE_L_PETAL@KURTI_SHIRT'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','kurti2_shirt_sleeve_puff_left.webp',2,'KURTI2_SLEEVE_L_PUFF@KURTI_SHIRT'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_shirt_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_SHIRT'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_shirt_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_SHIRT'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_shirt_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_SHIRT'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','kurti2_shirt_sleeve_bell_right.webp',2,'KURTI2_SLEEVE_R_BELL@KURTI_SHIRT'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','kurti2_shirt_sleeve_bishop_right.webp',2,'KURTI2_SLEEVE_R_BISHOP@KURTI_SHIRT'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','kurti2_shirt_sleeve_cap_right.webp',2,'KURTI2_SLEEVE_R_CAP@KURTI_SHIRT'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','kurti2_shirt_sleeve_full_right.webp',2,'KURTI2_SLEEVE_R_FULL@KURTI_SHIRT'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','kurti2_shirt_sleeve_half_right.webp',2,'KURTI2_SLEEVE_R_HALF@KURTI_SHIRT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','kurti2_shirt_sleeve_no_right.webp',2,'KURTI2_SLEEVE_R_NO_SLEEVE@KURTI_SHIRT'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','kurti2_shirt_sleeve_petal_right.webp',2,'KURTI2_SLEEVE_R_PETAL@KURTI_SHIRT'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','kurti2_shirt_sleeve_puff_right.webp',2,'KURTI2_SLEEVE_R_PUFF@KURTI_SHIRT'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_shirt_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_SHIRT'),
    ('NECK','NECK_SQUARE','NECK','CENTER','kurti2_shirt_neck_square.webp',3,'KURTI2_NECK_NECK_SQUARE@KURTI_SHIRT'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_shirt_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_SHIRT'),
    ('NECK','NECK_BOAT','NECK','CENTER','kurti2_straight_neck_boat.webp',3,'KURTI2_NECK_NECK_BOAT@KURTI_STRAIGHT'),
    ('STYLE','KURTI_STRAIGHT','BODY','CENTER','kurti2_straight_body.webp',1,'KURTI2_BODY_STRAIGHT'),
    ('NECK','NECK_CLASSIC_COLLAR','NECK','CENTER','kurti2_straight_neck_classic_collar.webp',3,'KURTI2_NECK_NECK_CLASSIC_COLLAR@KURTI_STRAIGHT'),
    ('SLEEVE','BELL','SLEEVE','LEFT','kurti2_straight_sleeve_bell_left.webp',2,'KURTI2_SLEEVE_L_BELL@KURTI_STRAIGHT'),
    ('SLEEVE','BISHOP','SLEEVE','LEFT','kurti2_straight_sleeve_bishop_left.webp',2,'KURTI2_SLEEVE_L_BISHOP@KURTI_STRAIGHT'),
    ('SLEEVE','CAP','SLEEVE','LEFT','kurti2_straight_sleeve_cap_left.webp',2,'KURTI2_SLEEVE_L_CAP@KURTI_STRAIGHT'),
    ('SLEEVE','FULL','SLEEVE','LEFT','kurti2_straight_sleeve_full_left.webp',2,'KURTI2_SLEEVE_L_FULL@KURTI_STRAIGHT'),
    ('SLEEVE','HALF','SLEEVE','LEFT','kurti2_straight_sleeve_half_left.webp',2,'KURTI2_SLEEVE_L_HALF@KURTI_STRAIGHT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','LEFT','kurti2_straight_sleeve_no_left.webp',2,'KURTI2_SLEEVE_L_NO_SLEEVE@KURTI_STRAIGHT'),
    ('SLEEVE','PETAL','SLEEVE','LEFT','kurti2_straight_sleeve_petal_left.webp',2,'KURTI2_SLEEVE_L_PETAL@KURTI_STRAIGHT'),
    ('SLEEVE','PUFF','SLEEVE','LEFT','kurti2_straight_sleeve_puff_left.webp',2,'KURTI2_SLEEVE_L_PUFF@KURTI_STRAIGHT'),
    ('NECK','NECK_MANDARIN_COLLAR','NECK','CENTER','kurti2_straight_neck_mandarin_collar.webp',3,'KURTI2_NECK_NECK_MANDARIN_COLLAR@KURTI_STRAIGHT'),
    ('NECK','NECK_NOTCHED_COLLAR','NECK','CENTER','kurti2_straight_neck_notched_collar.webp',3,'KURTI2_NECK_NECK_NOTCHED_COLLAR@KURTI_STRAIGHT'),
    ('NECK','NECK_PETER_PAN_COLLAR','NECK','CENTER','kurti2_straight_neck_peter_pan_collar.webp',3,'KURTI2_NECK_NECK_PETER_PAN_COLLAR@KURTI_STRAIGHT'),
    ('SLEEVE','BELL','SLEEVE','RIGHT','kurti2_straight_sleeve_bell_right.webp',2,'KURTI2_SLEEVE_R_BELL@KURTI_STRAIGHT'),
    ('SLEEVE','BISHOP','SLEEVE','RIGHT','kurti2_straight_sleeve_bishop_right.webp',2,'KURTI2_SLEEVE_R_BISHOP@KURTI_STRAIGHT'),
    ('SLEEVE','CAP','SLEEVE','RIGHT','kurti2_straight_sleeve_cap_right.webp',2,'KURTI2_SLEEVE_R_CAP@KURTI_STRAIGHT'),
    ('SLEEVE','FULL','SLEEVE','RIGHT','kurti2_straight_sleeve_full_right.webp',2,'KURTI2_SLEEVE_R_FULL@KURTI_STRAIGHT'),
    ('SLEEVE','HALF','SLEEVE','RIGHT','kurti2_straight_sleeve_half_right.webp',2,'KURTI2_SLEEVE_R_HALF@KURTI_STRAIGHT'),
    ('SLEEVE','NO_SLEEVE','SLEEVE','RIGHT','kurti2_straight_sleeve_no_right.webp',2,'KURTI2_SLEEVE_R_NO_SLEEVE@KURTI_STRAIGHT'),
    ('SLEEVE','PETAL','SLEEVE','RIGHT','kurti2_straight_sleeve_petal_right.webp',2,'KURTI2_SLEEVE_R_PETAL@KURTI_STRAIGHT'),
    ('SLEEVE','PUFF','SLEEVE','RIGHT','kurti2_straight_sleeve_puff_right.webp',2,'KURTI2_SLEEVE_R_PUFF@KURTI_STRAIGHT'),
    ('NECK','NECK_ROUND','NECK','CENTER','kurti2_straight_neck_round.webp',3,'KURTI2_NECK_NECK_ROUND@KURTI_STRAIGHT'),
    ('NECK','NECK_SCALLOP_SQUARE','NECK','CENTER','kurti2_straight_neck_scallop_square.webp',3,'KURTI2_NECK_NECK_SCALLOP_SQUARE@KURTI_STRAIGHT'),
    ('NECK','NECK_SCALLOP_V','NECK','CENTER','kurti2_straight_neck_scallop_v.webp',3,'KURTI2_NECK_NECK_SCALLOP_V@KURTI_STRAIGHT'),
    ('NECK','NECK_SQUARE','NECK','CENTER','kurti2_straight_neck_square.webp',3,'KURTI2_NECK_NECK_SQUARE@KURTI_STRAIGHT'),
    ('NECK','NECK_SWEETHEART','NECK','CENTER','kurti2_straight_neck_sweetheart.webp',3,'KURTI2_NECK_NECK_SWEETHEART@KURTI_STRAIGHT'),
    ('NECK','NECK_V','NECK','CENTER','kurti2_straight_neck_v.webp',3,'KURTI2_NECK_NECK_V@KURTI_STRAIGHT');

  drop table if exists pg_temp._kc;
  create temporary table _kc (grp text, code text, cost numeric, fabric numeric);
  insert into _kc values
    ('STYLE','KURTI_STRAIGHT',0,0),
    ('STYLE','KURTI_A_LINE',40,0.3),
    ('STYLE','KURTI_ANARKALI',90,1.2),
    ('STYLE','KURTI_ANGRAKHA',60,0.5),
    ('STYLE','KURTI_EMPIRE_LINE',60,0.6),
    ('STYLE','KURTI_HIGH_LOW',70,0.4),
    ('STYLE','KURTI_KAFTAN',50,0.6),
    ('STYLE','KURTI_SHIRT',20,0.1),
    ('NECK','NECK_BOAT',20,0.03),
    ('NECK','NECK_CLASSIC_COLLAR',25,0.02),
    ('NECK','NECK_MANDARIN_COLLAR',20,0.02),
    ('NECK','NECK_NOTCHED_COLLAR',30,0.03),
    ('NECK','NECK_PETER_PAN_COLLAR',30,0.03),
    ('NECK','NECK_ROUND',10,0),
    ('NECK','NECK_SCALLOP_SQUARE',45,0.05),
    ('NECK','NECK_SCALLOP_V',45,0.05),
    ('NECK','NECK_SQUARE',20,0.03),
    ('NECK','NECK_SWEETHEART',40,0.05),
    ('NECK','NECK_V',10,0),
    ('SLEEVE','BELL',30,0.5),
    ('SLEEVE','BISHOP',35,0.6),
    ('SLEEVE','CAP',0,0.1),
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
  select v_set, a.asset_code, 'Kurti - ' || a.layer || ' - ' || a.asset_code, a.layer, a.side,
         'kurti/v2/' || a.file, 768, 1024, a.z, true, false
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
