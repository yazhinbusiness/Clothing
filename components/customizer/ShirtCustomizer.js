"use client";

import { useEffect, useState } from "react";
import { getConfigurationRenderStack } from "@/services/configurationService";

/**
 * @param {{
 *   configuration: {
 *     id: string,
 *     status: string,
 *     size: string,
 *     material: string,
 *     color: string,
 *     options: Record<string, string>,
 *     pricing?: {
 *       sellingPrice: string
 *     }
 *   } | null
 * }} props
 */

/* =========================================================
   COLORS
   ========================================================= */

const colorMap = {
  WHITE: "#ffffff",
  BLACK: "#000000",
};

/* =========================================================
   DEFAULT PRODUCT PREVIEW

   Used before "Customize Shirt" is clicked.

   This does NOT create a product_configuration row.

   Current White Cotton Shirt defaults:
   - White
   - Full Sleeve
   - Classic Collar
   - No Pocket
   - Full Placket
   ========================================================= */

const defaultPreviewAssets = [
  {
    asset_id: "default-body-left",
    file_key: "shirt/v1/body/shirt_side_left.webp",
    z_index: 1,
    asset_name: "Shirt Side Left",
  },

  {
    asset_id: "default-body-right",
    file_key: "shirt/v1/body/shirt_side_right.webp",
    z_index: 1,
    asset_name: "Shirt Side Right",
  },

  {
    asset_id: "default-sleeve-left",
    file_key:
      "shirt/v1/sleeves/shirt_full_sleeve_left.webp",
    z_index: 2,
    asset_name: "Full Sleeve Left",
  },

  {
    asset_id: "default-sleeve-right",
    file_key:
      "shirt/v1/sleeves/shirt_full_sleeve_right.webp",
    z_index: 2,
    asset_name: "Full Sleeve Right",
  },

  {
    asset_id: "default-body-center",
    file_key: "shirt/v1/body/shirt_body.webp",
    z_index: 3,
    asset_name: "Shirt Body",
  },

  {
    asset_id: "default-placket",
    file_key:
      "shirt/v1/plackets/shirt_full_button_placket.webp",
    z_index: 4,
    asset_name: "Full Button Placket",
  },

  {
    asset_id: "default-collar",
    file_key:
      "shirt/v1/collars/shirt_classic_collar.webp",
    z_index: 5,
    asset_name: "Classic Collar",
  },
];

/* =========================================================
   LAYER COMPONENT
   ========================================================= */

function Layer({
  src,
  zIndex = 1,
  color = "#ffffff",
  alt = "",
}) {
  if (!src) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex,
        pointerEvents: "none",
      }}
    >
      {/* Original artwork preserves shadows,
          folds, stitching and texture */}
      <img
        src={src}
        alt={alt}
        draggable={false}
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

      {/* Dynamic garment color */}
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
          opacity: 0.82,

          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}

/* =========================================================
   ASSET URL

   Supabase:
   shirt/v1/sleeves/shirt_full_sleeve_left.webp

   Local Next.js:
   public/assets/shirt_full_sleeve_left.webp

   Browser:
   /assets/shirt_full_sleeve_left.webp

   Later this function can be changed to return R2 URLs.
   ========================================================= */

function getAssetUrl(fileKey) {
  if (!fileKey) {
    return null;
  }

  const fileName = fileKey.split("/").pop();

  return `/assets/${fileName}`;
}

/* =========================================================
   SHIRT CUSTOMIZER
   ========================================================= */

export default function ShirtCustomizer({
  configuration,
}) {
  const [renderStack, setRenderStack] = useState([]);
  const [renderLoading, setRenderLoading] =
    useState(false);
  const [renderError, setRenderError] =
    useState("");

  /* =======================================================
     CURRENT CONFIGURATION VALUES
     ======================================================= */

  const sleeve =
    configuration?.options?.SLEEVE ?? null;

  const collar =
    configuration?.options?.COLLAR ?? null;

  const pocket =
    configuration?.options?.POCKET ?? null;

  const placket =
    configuration?.options?.PLACKET ?? null;

  const fit =
    configuration?.options?.FIT ?? null;

  /* =======================================================
     GARMENT COLOR

     Before configuration exists:
     WHITE

     After configuration exists:
     use selected database color.
     ======================================================= */

  const garmentColor =
    colorMap[configuration?.color] ?? "#ffffff";

  /* =======================================================
     LOAD DATABASE RENDER STACK

     Reload only when something affecting artwork changes.

     Size/material/color do not require a new asset stack.

     Color updates Layer directly.
     ======================================================= */

  useEffect(() => {
    if (!configuration?.id) {
      setRenderStack([]);
      setRenderError("");
      setRenderLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRenderStack() {
      try {
        setRenderLoading(true);
        setRenderError("");

        const stack =
          await getConfigurationRenderStack(
            configuration.id
          );

        if (cancelled) {
          return;
        }

        setRenderStack(stack ?? []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Unable to load configuration render stack:",
          error
        );

        setRenderError(
          error instanceof Error
            ? error.message
            : "Unable to load shirt preview."
        );
      } finally {
        if (!cancelled) {
          setRenderLoading(false);
        }
      }
    }

    loadRenderStack();

    return () => {
      cancelled = true;
    };
  }, [
    configuration?.id,
    sleeve,
    collar,
    pocket,
    placket,
  ]);

  /* =======================================================
     VISIBLE RENDER STACK

     Before Customize:
     show default product preview.

     After Customize:
     show database-driven render stack.

     During a database refresh:
     keep previous stack visible to prevent flashing.
     ======================================================= */

  const visibleRenderStack =
    configuration?.id && renderStack.length > 0
      ? renderStack
      : defaultPreviewAssets;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div>
      <h2>Shirt Customizer</h2>

      {/* ===================================================
          VISUAL CANVAS
          =================================================== */}

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          aspectRatio: "1 / 1",
          overflow: "hidden",
        }}
      >
        {visibleRenderStack.map((asset) => (
          <Layer
            key={asset.asset_id}
            src={getAssetUrl(asset.file_key)}
            zIndex={asset.z_index ?? 1}
            color={garmentColor}
            alt={asset.asset_name ?? ""}
          />
        ))}
      </div>

      {/* ===================================================
          PREVIEW STATUS
          =================================================== */}

      {configuration &&
        renderLoading &&
        renderStack.length === 0 && (
          <p
            style={{
              fontSize: "13px",
              marginTop: "8px",
            }}
          >
            Loading customization...
          </p>
        )}

      {renderError && (
        <p
          style={{
            fontSize: "13px",
            color: "crimson",
            marginTop: "8px",
          }}
        >
          Preview error: {renderError}
        </p>
      )}

      {/* ===================================================
          TEMPORARY CONFIG DEBUG

          Useful while building the remaining phases.
          We can remove this when the final PDP UI is done.
          =================================================== */}

      {configuration ? (
        <div>
          <p>
            Material: {configuration.material}
          </p>

          <p>
            Color: {configuration.color}
          </p>

          <p>Sleeve: {sleeve}</p>

          <p>Collar: {collar}</p>

          <p>Pocket: {pocket}</p>

          <p>Placket: {placket}</p>

          <p>Fit: {fit}</p>
        </div>
      ) : (
        <p>
          Click Customize Shirt to start
          customizing.
        </p>
      )}
    </div>
  );
}