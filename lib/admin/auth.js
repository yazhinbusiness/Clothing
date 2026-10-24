import { getUserFromRequest } from "@/lib/supabase/server";

/**
 * Admin check for /api/admin/* routes (server only).
 *
 * The caller must be signed in (Bearer token verified by Supabase Auth) AND
 * their email must be listed in ADMIN_EMAILS (comma separated, in
 * .env.local / Vercel env). Nothing the browser says about itself is trusted.
 *
 * @returns {Promise<{user: object} | {error: Response}>}
 */
export async function requireAdmin(request) {
  const allowed = String(process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) {
    return {
      error: Response.json(
        { error: "ADMIN_EMAILS is not set on the server." },
        { status: 500 }
      ),
    };
  }
  const user = await getUserFromRequest(request);
  if (!user) {
    return { error: Response.json({ error: "Sign in required." }, { status: 401 }) };
  }
  const email = String(user.email ?? "").toLowerCase();
  if (!email || !user.email_confirmed_at || !allowed.includes(email)) {
    return { error: Response.json({ error: "Not an admin account." }, { status: 403 }) };
  }
  return { user };
}
