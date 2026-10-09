const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_PRIVATE_TOKEN =
  process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
const SHOPIFY_STOREFRONT_API_VERSION =
  process.env.SHOPIFY_STOREFRONT_API_VERSION || "2026-07";

export async function shopifyStorefront(query, variables = {}) {
  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  }

  if (!SHOPIFY_STOREFRONT_PRIVATE_TOKEN) {
    throw new Error("Missing SHOPIFY_STOREFRONT_PRIVATE_TOKEN");
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token":
          SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store",
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      `Shopify HTTP ${response.status}: ${JSON.stringify(json)}`
    );
  }

  if (json.errors) {
    throw new Error(
      `Shopify GraphQL error: ${JSON.stringify(json.errors)}`
    );
  }

  return json.data;
}