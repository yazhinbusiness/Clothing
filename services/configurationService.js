import { supabase } from "@/lib/supabase/client";
import { getGuestCartId } from "../lib/cart/guestCart";

export async function createDefaultConfiguration({
  productCode,
  sizeCode,
  priceBookCode = "PB_2026_01",
}) {
  const { data, error } = await supabase.rpc(
    "create_default_product_configuration",
    {
      p_product_code: productCode,
      p_size_code: sizeCode,
      p_price_book_code: priceBookCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getConfigurationDetails(
  configurationId
) {
  const { data, error } = await supabase.rpc(
    "get_configuration_details",
    {
      p_configuration_id: configurationId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Configuration not found.");
  }

  const firstRow = data[0];

  const options = {};

  data.forEach((row) => {
    if (row.option_group_code) {
      options[row.option_group_code] =
        row.option_value_code;
    }
  });

  return {
    id: firstRow.configuration_id,
    status: firstRow.configuration_status,

    product: {
      code: firstRow.product_code,
      name: firstRow.product_name,
    },

    size: firstRow.size_code,
    material: firstRow.material_code,
    color: firstRow.color_code,

    pricing: {
  totalFabricMeters:
    firstRow.total_fabric_meters,
  fabricCost:
    firstRow.fabric_cost,
  fullCost:
    firstRow.full_cost,
  sellingPrice:
    firstRow.selling_price,

  maxDiscountAmount:
    firstRow.max_discount_amount,
  maxDiscountPercent:
    firstRow.max_discount_percent,
},

    options,
  };
}

export async function updateConfigurationOption({
  configurationId,
  optionGroupCode,
  optionValueCode,
}) {
  const { error } = await supabase.rpc(
    "update_configuration_option",
    {
      p_configuration_id: configurationId,
      p_option_group_code: optionGroupCode,
      p_option_value_code: optionValueCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function updateConfigurationMaterial({
  configurationId,
  materialCode,
}) {
  const { error } = await supabase.rpc(
    "update_configuration_material",
    {
      p_configuration_id: configurationId,
      p_material_code: materialCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function updateConfigurationColor({
  configurationId,
  colorCode,
}) {
  const { error } = await supabase.rpc(
    "update_configuration_color",
    {
      p_configuration_id: configurationId,
      p_color_code: colorCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function updateConfigurationSize({
  configurationId,
  sizeCode,
}) {
  const { error } = await supabase.rpc(
    "update_configuration_size",
    {
      p_configuration_id: configurationId,
      p_size_code: sizeCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getConfigurationRenderStack(
  configurationId
) {
  const { data, error } = await supabase.rpc(
    "get_configuration_render_stack",
    {
      p_configuration_id: configurationId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getConfigurationUiRules(
  configurationId
) {
  const { data, error } = await supabase.rpc(
    "get_configuration_ui_rules",
    {
      p_configuration_id: configurationId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function updateConfigurationMeasurements(
  configurationId,
  measurements
) {
  const { chestMm, waistMm, hipMm } = measurements;

  const { data, error } = await supabase.rpc(
    "update_configuration_measurements",
    {
      p_configuration_id: configurationId,
      p_chest_mm: chestMm,
      p_waist_mm: waistMm,
      p_hip_mm: hipMm,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function useStandardConfigurationSize(
  configurationId
) {
  const { error } = await supabase.rpc(
    "use_standard_configuration_size",
    {
      p_configuration_id: configurationId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function addConfigurationToCart(
  configurationId
) {
  const guestCartId = getGuestCartId();

  if (!guestCartId) {
    throw new Error("Unable to create guest cart.");
  }

  const { data, error } = await supabase.rpc(
    "add_configuration_to_cart",
    {
      p_configuration_id: configurationId,
      p_guest_cart_id: guestCartId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCartItems() {
  const guestCartId = getGuestCartId();

  if (!guestCartId) {
    return [];
  }

  const { data, error } = await supabase.rpc(
    "get_cart_items",
    {
      p_guest_cart_id: guestCartId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function removeCartItem(cartItemId) {
  const guestCartId = getGuestCartId();

  if (!guestCartId) {
    throw new Error("Unable to identify guest cart.");
  }

  const { error } = await supabase.rpc(
    "remove_cart_item",
    {
      p_cart_item_id: cartItemId,
      p_guest_cart_id: guestCartId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCartItemQuantity(
  cartItemId,
  quantity
) {
  const guestCartId = getGuestCartId();

  if (!guestCartId) {
    throw new Error("Unable to identify guest cart.");
  }

  const { error } = await supabase.rpc(
    "update_cart_item_quantity",
    {
      p_cart_item_id: cartItemId,
      p_guest_cart_id: guestCartId,
      p_quantity: quantity,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}