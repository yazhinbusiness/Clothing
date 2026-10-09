import { getShopifyProducts } from "@/lib/shopify/catalog";
import { getAllProducts } from "@/services/productService";
import { getAllShopifyMappings } from "@/services/productMappingService";

import ShopifyMappingsAdmin from "@/components/admin/ShopifyMappingsAdmin";

export const metadata = {
  title: "Shopify Product Mappings — Oh Must Admin",
  robots: { index: false, follow: false },
};

export default async function ShopifyMappingsPage() {
  const [shopifyProducts, productMasters, mappings] = await Promise.all([
    getShopifyProducts(50).catch((err) => {
      console.error("Failed to load Shopify products:", err);
      return [];
    }),
    getAllProducts().catch((err) => {
      console.error("Failed to load product_master rows:", err);
      return [];
    }),
    getAllShopifyMappings().catch((err) => {
      console.error("Failed to load existing mappings:", err);
      return [];
    }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] px-4 sm:px-8 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[var(--font-display)] text-3xl mb-1">
          Shopify Product Mappings
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Link a Shopify product to a Supabase garment configuration, with
          optional default material/color overrides. Internal tool — not
          linked from the storefront.
        </p>

        <ShopifyMappingsAdmin
          shopifyProducts={shopifyProducts}
          productMasters={productMasters}
          mappings={mappings}
        />
      </div>
    </div>
  );
}
