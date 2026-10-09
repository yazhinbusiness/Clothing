"use server";

import { revalidatePath } from "next/cache";

import {
  upsertShopifyMapping,
  deleteShopifyMapping,
} from "@/services/productMappingService";

/**
 * Lightweight stopgap only — NOT real authentication. This project has
 * no admin login system yet (see the security note in
 * sql/shopify_product_mapping.sql). Set ADMIN_ACCESS_CODE in
 * .env.local; anyone who doesn't know it can't save or delete
 * mappings, but this page itself has no login/session, so don't treat
 * this as production-grade protection.
 */
function checkAccessCode(formData) {
  const provided = formData.get("accessCode");
  const expected = process.env.ADMIN_ACCESS_CODE;

  if (!expected) {
    throw new Error(
      "ADMIN_ACCESS_CODE is not set in .env.local — set it before using this page."
    );
  }
  if (provided !== expected) {
    throw new Error("Incorrect access code.");
  }
}

export async function saveMappingAction(formData) {
  checkAccessCode(formData);

  await upsertShopifyMapping({
    shopifyProductId: formData.get("shopifyProductId"),
    shopifyProductTitle: formData.get("shopifyProductTitle"),
    productCode: formData.get("productCode"),
    defaultMaterialCode: formData.get("defaultMaterialCode"),
    defaultColorCode: formData.get("defaultColorCode"),
    isActive: formData.get("isActive") === "on",
  });

  revalidatePath("/admin/shopify-mappings");
}

export async function deleteMappingAction(formData) {
  checkAccessCode(formData);

  await deleteShopifyMapping(formData.get("id"));

  revalidatePath("/admin/shopify-mappings");
}
