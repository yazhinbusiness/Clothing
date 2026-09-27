import { shopifyStorefront } from "../../../../lib/shopify/storefront";

export async function GET() {
  try {
    const data = await shopifyStorefront(`
      query {
        products(first: 5) {
          nodes {
            id
            title
            variants(first: 10) {
              nodes {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    `);

    return Response.json({
      success: true,
      products: data.products.nodes,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}