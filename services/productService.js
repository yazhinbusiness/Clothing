import { supabase } from "@/lib/supabase/client";

export async function getAllProducts() {
  const { data, error } = await supabase
    .from("product_master")
    .select("id, product_code, product_name")
    .order("product_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProductByCode(productCode) {
  const { data, error } = await supabase
    .from("product_master")
    .select(`
      id,
      product_code,
      product_name,
      garment_id
    `)
    .eq("product_code", productCode)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProductSizes(productCode) {
  const { data, error } = await supabase.rpc(
    "get_product_sizes",
    {
      p_product_code: productCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProductOptions(productCode) {
  const { data, error } = await supabase.rpc(
    "get_product_options",
    {
      p_product_code: productCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProductMaterials(productCode) {
  const { data, error } = await supabase.rpc(
    "get_product_materials",
    {
      p_product_code: productCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Colors scoped to a specific material — e.g. Linen only returns its
 * earthy palette, Satin only its jewel tones. Use this instead of
 * getProductColors wherever the current material is known (which is
 * everywhere in the live customizer).
 */
export async function getProductColorsForMaterial(productCode, materialCode) {
  const { data, error } = await supabase.rpc(
    "get_product_colors_for_material",
    {
      p_product_code: productCode,
      p_material_code: materialCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProductColors(productCode) {
  const { data, error } = await supabase.rpc(
    "get_product_colors",
    {
      p_product_code: productCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getDefaultProductPrice({
  productCode,
  sizeCode = "M",
  priceBookCode = "PB_2026_01",
}) {
  const { data, error } = await supabase.rpc(
    "get_default_product_price",
    {
      p_product_code: productCode,
      p_size_code: sizeCode,
      p_price_book_code: priceBookCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Default product price not found.");
  }

  return data[0];
}