"use client";

import { useId, useMemo, useState } from "react";

/* =========================================================
   LAYER — unchanged rendering technique from before: the
   original artwork for shadows/texture, plus a CSS mask-image
   tint on top for color. Only HOW layers get shown/hidden
   changes in this rewrite (see below).
   ========================================================= */

function Layer({ src, zIndex = 1, filterId, alt = "", visible }) {
  const [failed, setFailed] = useState(false);

  // If a DB row ever points at a file that no longer exists (e.g. a
  // retired asset like the old placket placeholder), just hide that
  // layer instead of leaving a broken image — don't depend on the
  // database being perfectly tidy for the UI to render cleanly.
  if (!src || failed) return null;

  // The colour is applied to the artwork's OWN pixels by an SVG filter
  // (see TintFilter), so folds/shadows stay and — unlike the old
  // "plain image + masked colour overlay" — there is no second layer
  // whose anti-aliased edge can leave a pale outline around each piece.
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      loading="eager"
      onError={() => setFailed(true)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
        zIndex,
        opacity: visible ? 1 : 0,
        filter: `url(#${filterId})`,
        transition: "opacity 150ms ease",
      }}
    />
  );
}

/* =========================================================
   TINT FILTER — maps the white-ish artwork to the chosen colour
   while keeping its light/dark detail (folds, drape, seams).
   slope/intercept are chosen so the artwork's typical highlight
   (~0.94) becomes exactly the target colour and darker folds
   scale down from it. Alpha is untouched.
   ========================================================= */
function hexToRgb(hex) {
  let h = String(hex).trim();
  if (/^hsl/i.test(h)) {
    // fallback colours from getColorHex() can be hsl(...)
    const m = h.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
    if (m) {
      const [hh, ss, ll] = [Number(m[1]) / 360, Number(m[2]) / 100, Number(m[3]) / 100];
      const f = (n) => {
        const k = (n + hh * 12) % 12;
        const a = ss * Math.min(ll, 1 - ll);
        return ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      };
      return [f(0), f(8), f(4)];
    }
  }
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0.55, 0.55, 0.55];
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function TintFilter({ id, color }) {
  const GAIN = 2.4;
  const HIGHLIGHT = 0.94;
  const channels = hexToRgb(color).map((c) => Math.max(c, 0.07));
  const slope = channels.map((c) => (GAIN * c).toFixed(4));
  const intercept = channels.map((c) => ((1 - GAIN * HIGHLIGHT) * c).toFixed(4));
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feComponentTransfer>
            <feFuncR type="linear" slope={slope[0]} intercept={intercept[0]} />
            <feFuncG type="linear" slope={slope[1]} intercept={intercept[1]} />
            <feFuncB type="linear" slope={slope[2]} intercept={intercept[2]} />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}

function getAssetUrl(fileKey) {
  if (!fileKey) return null;
  const fileName = fileKey.split("/").pop();
  return `/assets/${fileName}`;
}

/* =========================================================
   SHIRT CUSTOMIZER — rewritten for instant local toggling.

   Previously: every option change called getConfigurationRenderStack
   (a Supabase round-trip) to learn what to show, so the image lagged
   behind the click.

   Now: the full asset manifest (every asset + which option value
   shows which asset) is fetched ONCE by the parent and passed in via
   `manifest`. Every asset renders from first mount (so the browser
   preloads them all immediately), just hidden via opacity unless
   currently selected. Changing `selection` is a pure prop change —
   zero network calls, zero loading state, instant.

   @param {object} manifest - from getCustomizerManifest(), shape:
     { assets: [{asset_code, file_key, z_index, is_base_asset}],
       valueAssets: { [option_value_code]: [asset_code, ...] } }
   @param {object} selection - { [option_group_code]: option_value_code }
     e.g. { FIT: "REGULAR", COLLAR: "CLASSIC", SLEEVE: "FULL", ... }
   @param {string} colorHex - current color tint
   ========================================================= */
export default function ShirtCustomizer({ manifest, selection, colorHex = "#f5f1ea" }) {
  // Unique per instance (the page renders this component twice: gallery
  // and floating preview) and safe to use inside url(#...).
  const filterId = `om-tint-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const visibleAssetCodes = useMemo(() => {
    const visible = new Set();
    for (const asset of manifest?.assets ?? []) {
      if (asset.is_base_asset) visible.add(asset.asset_code);
    }
    // Keyed by "GROUP_CODE:VALUE_CODE" — several groups reuse the same
    // value code (e.g. Sleeve and Placket both have "FULL"), so the
    // bare value code alone isn't a safe lookup key.
    for (const [groupCode, valueCode] of Object.entries(selection ?? {})) {
      const codes = manifest?.valueAssets?.[`${groupCode}:${valueCode}`];
      if (codes) codes.forEach((c) => visible.add(c));
    }
    return visible;
  }, [manifest, selection]);

  if (!manifest?.assets?.length) {
    return (
      <div className="flex items-center justify-center aspect-square w-full">
        <span className="h-8 w-8 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "600px",
        aspectRatio: "1 / 1",
        margin: "0 auto",
        overflow: "hidden",
      }}
    >
      <TintFilter id={filterId} color={colorHex} />
      {manifest.assets.map((asset) => (
        <Layer
          key={asset.asset_code}
          src={getAssetUrl(asset.file_key)}
          zIndex={asset.z_index ?? 1}
          filterId={filterId}
          alt={asset.asset_code}
          visible={visibleAssetCodes.has(asset.asset_code)}
        />
      ))}
    </div>
  );
}
