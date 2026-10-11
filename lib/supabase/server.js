import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase helpers (API routes). Never import this from a
 * "use client" file — it can read SUPABASE_SERVICE_ROLE_KEY.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

/** Same permissions as the browser (anon key). */
export function anonClient() {
  if (!URL || !ANON) throw new Error("Missing Supabase URL / anon key");
  return createClient(URL, ANON, opts);
}

/** Bypasses row-level security. Use only for trusted server work. */
export function serviceClient() {
  if (!URL || !SERVICE) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(URL, SERVICE, opts);
}

/**
 * Reads "Authorization: Bearer <access token>" and asks Supabase Auth who it
 * belongs to. Returns the user or null — never trusts anything the client
 * claims about itself.
 */
export async function getUserFromRequest(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await anonClient().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
