import { supabase } from "@/lib/supabase/client";

/**
 * Everything needed to render the customizer instantly, client-side,
 * with zero further network calls per option change: every option
 * group/value for the garment, every asset, and which asset(s) each
 * option value shows. Fetched ONCE (see ConfiguratorLoader / when
 * Customize is tapped).
 */
export async function getCustomizerManifest(garmentCode) {
  const { data, error } = await supabase.rpc("get_customizer_manifest", {
    p_garment_code: garmentCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Every pricing ingredient for the garment (base costs, cost rules,
 * profit rule, option fixed costs, fabric consumption by option and
 * by size, material price per meter) — small, fetched ONCE, used to
 * compute price instantly client-side on every change. The server
 * (get_configuration_details / cart) remains the final source of
 * truth and is re-checked at Add to Bag / Buy Now.
 */
export async function getPricingManifest(garmentCode) {
  const { data, error } = await supabase.rpc("get_pricing_manifest", {
    p_garment_code: garmentCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
