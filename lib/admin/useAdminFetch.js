"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth/useAuth";

/** Signed-in fetch helper for the admin screens: adds the Bearer token, throws readable errors. */
export function useAdminFetch() {
  const auth = useAuth();
  const { accessToken } = auth;
  const call = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(json.error || `Request failed (${res.status})`);
        err.status = res.status;
        throw err;
      }
      return json;
    },
    [accessToken]
  );
  return { ...auth, call };
}

export const inr = (n) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-";

export const mmToCm = (mm) => `${Math.round(Number(mm))} mm`; // measurements are kept in millimetres
