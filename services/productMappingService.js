import { supabase } from "@/lib/supabase/client";

export async function getAllShopifyMappings() {
  const { data, error } = await supabase
    .from("shopify_product_mapping")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getActiveMappingForShopifyProduct(shopifyProductId) {
  const { data, error } = await supabase
    .from("shopify_product_mapping")
    .select("*")
    .eq("shopify_product_id", shopifyProductId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function upsertShopifyMapping({
  shopifyProductId,
  shopifyProductTitle,
  productCode,
  defaultMaterialCode,
  defaultColorCode,
  isActive = true,
}) {
  const { data, error } = await supabase
    .from("shopify_product_mapping")
    .upsert(
      {
        shopify_product_id: shopifyProductId,
        shopify_product_title: shopifyProductTitle,
        product_code: productCode,
        default_material_code: defaultMaterialCode || null,
        default_color_code: defaultColorCode || null,
        is_active: isActive,
      },
      { onConflict: "shopify_product_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteShopifyMapping(id) {
  const { error } = await supabase
    .from("shopify_product_mapping")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
