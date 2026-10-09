/**
 * Creates a handful of placeholder products in the connected Shopify
 * Dev Store, so the landing page has something real to list besides
 * the single "White Cotton Shirt" product.
 *
 * Run locally (not from this chat — it needs network access to your
 * Shopify store, which this sandbox doesn't have). Uses Node's built-in
 * --env-file flag (Node 20.6+) to load .env.local, so no extra
 * dependency is needed:
 *
 *   node --env-file=.env.local scripts/create-placeholder-products.mjs
 *
 * Requires in your .env.local (or exported in your shell):
 *   SHOPIFY_STORE_DOMAIN               e.g. oh-must.myshopify.com
 *   SHOPIFY_ADMIN_API_TOKEN            an Admin API access token (shpat_...)
 *   SHOPIFY_STOREFRONT_API_VERSION     e.g. 2026-07 (reused for Admin API)
 *
 * IMPORTANT: this needs an *Admin API* access token, not the Storefront
 * token. If the shpat_... token you already have was actually meant for
 * the Admin API (its prefix suggests that), reuse it here under
 * SHOPIFY_ADMIN_API_TOKEN and leave SHOPIFY_STOREFRONT_PRIVATE_TOKEN as
 * whatever the real Storefront token turns out to be.
 *
 * Safe to re-run: it always creates NEW products (Shopify doesn't
 * de-dupe by title), so don't run it twice unless you want duplicates —
 * delete the extras from the Shopify admin if that happens.
 */

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2024-10";

if (!DOMAIN || !TOKEN) {
  console.error(
    "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN in your environment."
  );
  process.exit(1);
}

const ENDPOINT = `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

const PLACEHOLDER_PRODUCTS = [
  {
    title: "Tailored Blazer",
    productType: "Outerwear",
    price: "8999.00",
    description:
      "Structured corporate blazer with a precise, tailored silhouette. Made to order.",
    imageColor: "d1a456",
  },
  {
    title: "Pleated Trousers",
    productType: "Bottoms",
    price: "4499.00",
    description:
      "Wide-leg pleated trousers cut for all-day comfort without losing structure.",
    imageColor: "9c7c42",
  },
  {
    title: "Classic Shirt Dress",
    productType: "Dresses",
    price: "6999.00",
    description:
      "A sharp shirt dress built for the boardroom, made to your measurements.",
    imageColor: "1f2a44",
  },
  {
    title: "Pencil Skirt",
    productType: "Bottoms",
    price: "3999.00",
    description: "A clean-lined pencil skirt with a precise, tailored fit.",
    imageColor: "3a3a3a",
  },
];

async function shopifyGraphQL(query, variables) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

const PRODUCT_CREATE = /* GraphQL */ `
  mutation CreateProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        variants(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const VARIANT_PRICE_UPDATE = /* GraphQL */ `
  mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors {
        field
        message
      }
    }
  }
`;

const ATTACH_IMAGE = /* GraphQL */ `
  mutation AttachImage($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

async function createPlaceholderProduct(item) {
  const createResult = await shopifyGraphQL(PRODUCT_CREATE, {
    input: {
      title: item.title,
      descriptionHtml: `<p>${item.description}</p>`,
      productType: item.productType,
      vendor: "Oh Must",
      status: "ACTIVE",
    },
  });

  const errors = createResult.productCreate.userErrors;
  if (errors?.length) {
    throw new Error(
      `Failed creating "${item.title}": ${JSON.stringify(errors)}`
    );
  }

  const product = createResult.productCreate.product;
  const variantId = product.variants.edges[0]?.node?.id;

  if (variantId) {
    await shopifyGraphQL(VARIANT_PRICE_UPDATE, {
      productId: product.id,
      variants: [{ id: variantId, price: item.price }],
    });
  }

  // Dark+gold placeholder image matching the storefront's palette —
  // swap for real product photography whenever it's ready; this step
  // can just be skipped then.
  const placeholderImageUrl = `https://placehold.co/900x1125/0b0b0c/${item.imageColor}png?text=${encodeURIComponent(
    item.title
  )}`;

  await shopifyGraphQL(ATTACH_IMAGE, {
    productId: product.id,
    media: [
      {
        originalSource: placeholderImageUrl,
        mediaContentType: "IMAGE",
        alt: item.title,
      },
    ],
  });

  console.log(`Created: ${item.title} (${product.id})`);
}

async function run() {
  for (const item of PLACEHOLDER_PRODUCTS) {
    try {
      await createPlaceholderProduct(item);
    } catch (err) {
      console.error(err.message);
    }
  }
  console.log("Done.");
}

run();
