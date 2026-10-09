"use client";

import { useMemo, useState } from "react";

/* =========================================================
   LAYER — unchanged rendering technique from before: the
   original artwork for shadows/texture, plus a CSS mask-image
   tint on top for color. Only HOW layers get shown/hidden
   changes in this rewrite (see below).
   ========================================================= */

function Layer({ src, zIndex = 1, color = "#ffffff", alt = "", visible }) {
  const [failed, setFailed] = useState(false);

  // If a DB row ever points at a file that no longer exists (e.g. a
  // retired asset like the old placket placeholder), just hide that
  // layer instead of leaving a broken image — don't depend on the
  // database being perfectly tidy for the UI to render cleanly.
  if (!src || failed) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 150ms ease",
      }}
    >
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
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundColor: color,
          WebkitMaskImage: `url("${src}")`,
          maskImage: `url("${src}")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          mixBlendMode: "multiply",
          opacity: visible ? 0.82 : 0,
          transition: "opacity 150ms ease",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
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
      {manifest.assets.map((asset) => (
        <Layer
          key={asset.asset_code}
          src={getAssetUrl(asset.file_key)}
          zIndex={asset.z_index ?? 1}
          color={colorHex}
          alt={asset.asset_code}
          visible={visibleAssetCodes.has(asset.asset_code)}
        />
      ))}
    </div>
  );
}
