/**
 * Shopify Admin API (server only).
 *
 * Auth: Dev Dashboard app + client-credentials grant. Tokens last ~24h, so we
 * fetch one on demand, cache it in memory, and refresh shortly before expiry.
 *
 * Env: SHOPIFY_ADMIN_DOMAIN (xxx.myshopify.com; falls back to SHOPIFY_STORE_DOMAIN),
 *      SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_ADMIN_API_VERSION (optional)
 */
const DOMAIN =
  process.env.SHOPIFY_ADMIN_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION =
  process.env.SHOPIFY_ADMIN_API_VERSION ||
  process.env.SHOPIFY_STOREFRONT_API_VERSION ||
  "2026-07";

let cached = { token: null, expiresAt: 0 };

async function getAdminToken() {
  if (!DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Missing SHOPIFY_ADMIN_DOMAIN / SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET"
    );
  }
  if (cached.token && Date.now() < cached.expiresAt - 5 * 60 * 1000) {
    return cached.token;
  }

  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(
      `Shopify token request failed (HTTP ${res.status}): ${JSON.stringify(json)}`
    );
  }
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + Number(json.expires_in || 86399) * 1000,
  };
  return cached.token;
}

export async function shopifyAdmin(query, variables = {}) {
  const token = await getAdminToken();
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Shopify Admin HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json.errors) {
    throw new Error(`Shopify Admin GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

/* ---------- Draft orders ---------- */

const DRAFT_ORDER_CREATE = /* GraphQL */ `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        invoiceUrl
        status
        totalPriceSet { shopMoney { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

export async function createDraftOrder(input) {
  const data = await shopifyAdmin(DRAFT_ORDER_CREATE, { input });
  const { draftOrder, userErrors } = data.draftOrderCreate;
  if (userErrors?.length) {
    throw new Error(
      `Shopify rejected the draft order: ${userErrors
        .map((e) => `${(e.field || []).join(".")} ${e.message}`)
        .join("; ")}`
    );
  }
  if (!draftOrder?.invoiceUrl) {
    throw new Error("Shopify created the draft order but returned no checkout link.");
  }
  return draftOrder;
}

const DRAFT_ORDER_STATUS = /* GraphQL */ `
  query DraftOrderStatus($id: ID!) {
    draftOrder(id: $id) {
      id
      status
      order {
        id
        name
        displayFinancialStatus
        processedAt
      }
    }
  }
`;

/** @returns {{status:string, order:{id,name,displayFinancialStatus,processedAt}|null}|null} */
export async function getDraftOrderStatus(draftOrderId) {
  const data = await shopifyAdmin(DRAFT_ORDER_STATUS, { id: draftOrderId });
  return data.draftOrder ?? null;
}
