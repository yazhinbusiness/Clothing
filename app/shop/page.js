import StoreShell from "@/components/layout/StoreShell";
import ShopGrid from "@/components/shop/ShopGrid";
import { getShopifyProducts } from "@/lib/shopify/catalog";

export const metadata = {
  title: "Shop — Oh Must",
};

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) ?? {};

  let products = [];
  let loadError = "";

  try {
    products = await getShopifyProducts(100);
  } catch (err) {
    console.error("Failed to load Shopify products:", err);
    loadError = err instanceof Error ? err.message : "Unable to load products.";
  }

  return (
    <StoreShell>
      <main className="flex-1 min-w-0">
        <ShopGrid
          products={products}
          loadError={loadError}
          initialCategory={typeof params.cat === "string" ? params.cat : "ALL"}
          initialQuery={typeof params.q === "string" ? params.q : ""}
        />
      </main>
    </StoreShell>
  );
}
