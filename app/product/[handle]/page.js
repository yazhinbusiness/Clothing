import { notFound } from "next/navigation";

import StoreShell from "@/components/layout/StoreShell";
import ShopifyProductView from "@/components/product/ShopifyProductView";
import ConfiguratorLoader from "@/components/product/ConfiguratorLoader";
import {
  getShopifyProductByHandle,
  getConfiguratorMapping,
} from "@/lib/shopify/catalog";

export default async function ProductPage({ params }) {
  const { handle } = await params;

  let shopifyProduct;
  try {
    shopifyProduct = await getShopifyProductByHandle(handle);
  } catch (err) {
    console.error("Failed to load Shopify product:", err);
    shopifyProduct = null;
  }

  if (!shopifyProduct) {
    notFound();
  }

  const mapping = await getConfiguratorMapping(shopifyProduct);

  return (
    <StoreShell hideBottomNav>
      <main className="flex-1 min-w-0">
        {mapping?.productCode ? (
          // Mapped products go straight to the full configurator flow —
          // ProductDetails itself shows Shopify's photos until Customize
          // is tapped, then switches to the live render. No separate
          // "just a Customize button" screen in between anymore.
          <ConfiguratorLoader
            productCode={mapping.productCode}
            defaultMaterialCode={mapping.defaultMaterialCode}
            defaultColorCode={mapping.defaultColorCode}
            defaultOptions={mapping.defaultOptions}
            shopifyProduct={shopifyProduct}
          />
        ) : (
          // No garment data exists yet for this product — nothing to
          // show disabled previews of, so this stays a simple fallback.
          <ShopifyProductView shopifyProduct={shopifyProduct} />
        )}
      </main>
    </StoreShell>
  );
}
