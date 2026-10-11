import { supabase } from "@/lib/supabase/client";

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

export const getMeasurementForm = () => rpc("get_measurement_form");
export const getMyProfiles = () => rpc("get_my_measurement_profiles");

export const saveMyProfile = ({ id = null, name, values, weightKg = null, makeDefault = false }) =>
  rpc("save_my_measurement_profile", {
    p_profile_id: id,
    p_name: name,
    p_values: values,
    p_weight_kg: weightKg,
    p_make_default: makeDefault,
  });

export const deleteMyProfile = (id) =>
  rpc("delete_my_measurement_profile", { p_profile_id: id });

export const applyProfileToConfiguration = (configurationId, profileId) =>
  rpc("apply_my_profile_to_configuration", {
    p_configuration_id: configurationId,
    p_profile_id: profileId,
  });

export const getCustomSizeOffer = (configurationId) =>
  rpc("get_custom_size_offer", { p_configuration_id: configurationId });

export const requestRemake = ({ sessionId, cartItemId, values, reason = null }) =>
  rpc("request_remake", {
    p_checkout_session_id: sessionId,
    p_cart_item_id: cartItemId,
    p_new_values: values,
    p_reason: reason,
  });

// Measurements are stored in millimetres. Tailors' tapes are in inches,
// so the form works in inches (default) or centimetres.
const MM_PER_UNIT = { in: 25.4, cm: 10 };

export const mmToUnit = (mm, unit = "in") => {
  if (mm === undefined || mm === null || mm === "") return "";
  const v = Number(mm) / MM_PER_UNIT[unit];
  return String(Math.round(v * 100) / 100);
};

/** "32", "32.5", "32 1/2" and "1/2" are all accepted. Returns mm, or NaN. */
export const parseToMm = (text, unit = "in") => {
  const t = String(text ?? "").trim().replace(",", ".");
  if (!t) return NaN;
  let value;
  const mixed = t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (mixed) value = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  else if (frac) value = Number(frac[1]) / Number(frac[2]);
  else if (/^\d*\.?\d+$/.test(t)) value = Number(t);
  else return NaN;
  return Number.isFinite(value) ? Math.round(value * MM_PER_UNIT[unit]) : NaN;
};

export const unitLabel = (unit) => (unit === "in" ? "in" : "cm");
export const fmtMm = (mm, unit = "in") => `${mmToUnit(mm, unit)} ${unitLabel(unit)}`;

// kept for any older callers
export const mmToCm = (mm) => mmToUnit(mm, "cm");
export const cmToMm = (cm) => parseToMm(cm, "cm");
