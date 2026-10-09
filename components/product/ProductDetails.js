"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { computeShirtPrice } from "@/lib/pricing/shirtPricing";

import {
  getDefaultProductPrice,
  getProductColorsForMaterial,
} from "@/services/productService";
import ShirtCustomizer from "@/components/customizer/ShirtCustomizer";

import ProductGallery from "@/components/product/ProductGallery";
import FloatingPreview from "@/components/product/FloatingPreview";
import ShopifyGallery from "@/components/product/ShopifyGallery";
import { CART_UPDATED_EVENT } from "@/components/layout/StoreShell";
import { FeatureRow, ShippingRow } from "@/components/product/TrustBadges";
import RelatedProducts from "@/components/product/RelatedProducts";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import ColorSwatch from "@/components/ui/ColorSwatch";
import OptionSwatchCard from "@/components/product/OptionSwatchCard";
import { getColorHex } from "@/lib/colorMap";
import {
  CheckIcon,
  SleeveIcon,
  CollarIcon,
  PocketIcon,
  PlacketIcon,
  FitIcon,
  FabricIcon,
} from "@/components/ui/icons";

/**
 * One placeholder icon per option GROUP (not per value) — swap this
 * for real per-option photography later by rendering an <img> here
 * instead, keyed the same way. See OptionSwatchCard for where it's used.
 */
const OPTION_GROUP_ICONS = {
  SLEEVE: SleeveIcon,
  COLLAR: CollarIcon,
  POCKET: PocketIcon,
  PLACKET: PlacketIcon,
  FIT: FitIcon,
};

function formatOptionLabel(code) {
  if (!code) return "";
  return code
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

import {
  createDefaultConfiguration,
  getConfigurationDetails,
  updateConfigurationOption,
  updateConfigurationMaterial,
  updateConfigurationColor,
  updateConfigurationSize,
  getConfigurationUiRules,
  updateConfigurationMeasurements,
  useStandardConfigurationSize,
  addConfigurationToCart,
} from "@/services/configurationService";

/**
 * @typedef {Object} ProductSize
 * @property {string} size_code
 * @property {number} sort_order
 */

/**
 * @typedef {Object} ProductOption
 * @property {string} option_group_code
 * @property {string} option_value_code
 * @property {boolean} is_default
 */

/**
 * @typedef {Object} ProductMaterial
 * @property {string} material_code
 * @property {boolean} is_default
 */

/**
 * @typedef {Object} ProductColor
 * @property {string} color_code
 * @property {boolean} is_default
 */

/**
 * @param {{
 *   product: any,
 *   sizes: ProductSize[],
 *   options: Record<string, ProductOption[]>,
 *   materials: ProductMaterial[],
 *   colors: ProductColor[],
 *   defaultPrice: {
 *     selling_price: string,
 *     protected_price_floor: string,
 *     max_discount_amount: string,
 *     max_discount_percent: string
 *   } | null
 * }} props
 */

export default function ProductDetails({
  product,
  sizes,
  options,
  materials,
  colors: initialColors,
  defaultPrice,
  manifest,
  pricingManifest,
  shopifyProduct = null,
}) {
  /* =========================================================
     DEFAULT VALUES
     ========================================================= */

  const defaultMaterial =
    materials.find(
      (material) => material.is_default
    )?.material_code ?? "";

  const defaultColor =
    initialColors.find(
      (color) => color.is_default
    )?.color_code ?? "";

  /* =========================================================
     LOCAL PDP STATE
     ========================================================= */

  const [selectedSize, setSelectedSize] =
    useState("M");

  const [selectedMaterial, setSelectedMaterial] =
    useState(defaultMaterial);

  const [selectedColor, setSelectedColor] =
    useState(defaultColor);

  const [previewPrice, setPreviewPrice] =
    useState(defaultPrice);

  /* =========================================================
     COLOR LIST — scoped to whichever material is selected.
     Starts as whatever ConfiguratorLoader fetched for the
     starting material, then refreshes whenever material changes
     (see handleMaterialChange below).
     ========================================================= */
  const [colorList, setColorList] = useState(initialColors);

  // Options are clickable from the moment the page loads. The first
  // time the customer touches one (or taps Customize), we flip this to
  // true so the gallery swaps from Shopify's photo to the live render
  // that can actually reflect their choices. The "Customize" button is
  // an invitation + shortcut, not a gate.
  const [customizeStarted, setCustomizeStarted] = useState(false);
  const optionsSectionRef = useRef(null);

  function startCustomizing() {
    setCustomizeStarted(true);
  }

  function withStart(handler) {
    return (...args) => {
      startCustomizing();
      return handler(...args);
    };
  }

  async function refreshColorsForMaterial(materialCode) {
    try {
      const freshColors = await getProductColorsForMaterial(
        product.product_code,
        materialCode
      );
      setColorList(freshColors);
      return freshColors;
    } catch (err) {
      console.error("Color list refresh error:", err);
      return colorList;
    }
  }

  /* =========================================================
     DRAFT SELECTION — instant, local, drives the visual + the
     live price. Separate from `configuration` (the saved backend
     state) on purpose: tapping an option updates this immediately
     (zero network), while the actual save to Supabase still goes
     through the exact same handlers as before, just no longer
     blocking the UI from updating first. See withDraftUpdate below
     and handleAddToCart for where the two get reconciled.
     ========================================================= */
  const initialDraftSelection = Object.fromEntries(
    Object.entries(options).map(([groupCode, groupOptions]) => [
      groupCode,
      groupOptions.find((o) => o.is_default)?.option_value_code ??
        groupOptions[0]?.option_value_code ??
        null,
    ])
  );

  const [draftSelection, setDraftSelection] = useState(initialDraftSelection);

  // Tracks the most recent in-flight background save, so Add to Bag /
  // Buy Now can wait for it to actually land before freezing a price —
  // closes the race where someone taps an option and immediately hits
  // Add to Bag before that option's save has reached the database.
  const pendingSaveRef = useRef(null);

  // Rewrites the server's "Invalid configuration: X cannot be used
  // with Y" into something a customer (not a developer) can act on.
  // Falls back to the raw message for anything that doesn't match.
  function friendlyAddToCartError(err) {
    const message = err instanceof Error ? err.message : String(err);
    const match = message.match(
      /Invalid configuration:\s*(\w+)\s*cannot be used with\s*(\w+)/i
    );
    if (match) {
      const [, a, b] = match;
      const label = (code) =>
        code.charAt(0) + code.slice(1).toLowerCase().replace(/_/g, " ");
      return `${label(a)} can't be combined with ${label(b)} — please pick a different option.`;
    }
    return message || "Unable to add item to cart.";
  }

  function withDraftUpdate(groupCode, valueCode, handler) {
    return (...args) => {
      // Visual update is always instant, regardless of anything below.
      setDraftSelection((prev) => ({ ...prev, [groupCode]: valueCode }));

      // But background SAVES are serialized — if you tap two options
      // quickly, the second save waits for the first to land before
      // starting. This matters specifically for compatibility-rule
      // checking: the "disable incompatible options" logic only
      // refreshes after each save completes, so out-of-order saves
      // could let it fall behind what's actually selected. This adds
      // a little latency only for rapid back-to-back taps — a single
      // tap is unaffected.
      const previousSave = pendingSaveRef.current;
      const thisSave = (async () => {
        if (previousSave) {
          await previousSave.catch(() => {});
        }
        return handler(...args);
      })();

      pendingSaveRef.current = thisSave.catch((err) => {
        console.error("Background option save failed:", err);
      });
    };
  }

  const localPrice = useMemo(() => {
    if (!pricingManifest) return null;
    try {
      return computeShirtPrice(pricingManifest, {
        sizeCode: selectedSize,
        materialCode: selectedMaterial,
        optionValueCodes: Object.values(draftSelection).filter(Boolean),
      });
    } catch (err) {
      console.error("Local price computation error:", err);
      return null;
    }
  }, [pricingManifest, selectedSize, selectedMaterial, draftSelection]);

  /* =========================================================
   MEASUREMENT STATE
   ========================================================= */

const [measurementMode, setMeasurementMode] =
  useState("STANDARD");

const [customMeasurements, setCustomMeasurements] =
  useState({
    chest: "",
    waist: "",
    hip: "",
  });

  /* =========================================================
     CONFIGURATION STATE
     ========================================================= */

  const [configuration, setConfiguration] =
    useState(null);

  // The live render replaces Shopify's photo once customizing begins.
  // (Must stay below the `configuration` state it reads.)
  const showLive = customizeStarted || Boolean(configuration);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     COMPATIBILITY STATE
     ========================================================= */

  const [uiRules, setUiRules] =
    useState([]);

  const [cartMessage, setCartMessage] = useState("");

  /* =========================================================
     CREATE CONFIGURATION
     ========================================================= */

  /*
   * Creates the saved configuration (if one doesn't exist yet) using the
   * customer's current size/material/color, and syncs React state to it.
   * Shared by the Customize button and by the very first option tap, so
   * options can be clicked straight away without pressing Customize.
   */
  async function createConfigurationAndSync() {
    const configurationId =
      await createDefaultConfiguration({
        productCode: product.product_code,
        sizeCode: selectedSize,
      });

    // createDefaultConfiguration applies the product's database
    // defaults — apply anything the customer already changed.
    if (selectedMaterial && selectedMaterial !== defaultMaterial) {
      await updateConfigurationMaterial({
        configurationId,
        materialCode: selectedMaterial,
      });
    }

    if (selectedColor && selectedColor !== defaultColor) {
      await updateConfigurationColor({
        configurationId,
        colorCode: selectedColor,
      });
    }

    const configurationDetails =
      await getConfigurationDetails(configurationId);

    setConfiguration(configurationDetails);
    setSelectedSize(configurationDetails.size);
    setSelectedMaterial(configurationDetails.material);
    setSelectedColor(configurationDetails.color);

    return configurationId;
  }

  async function handleCustomize() {
    startCustomizing();

    // Take the customer to the options — that's what Customize means.
    optionsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    if (configuration) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createConfigurationAndSync();
    } catch (err) {
      console.error("Configuration error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     OPTION CHANGE
     ========================================================= */

  async function handleOptionChange(
    groupCode,
    optionValueCode
  ) {
    /*
     * Extra frontend guard.
     *
     * The disabled chip should normally prevent this,
     * but we also protect the handler itself.
     */

    if (
      configuration &&
      isOptionDisabled(
        groupCode,
        optionValueCode
      )
    ) {
      setError(
        `${optionValueCode} is not available with the current configuration.`
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      // First option tap before any configuration exists: create it
      // now (using the current size/material/color), then apply this
      // option on top.
      const configurationId =
        configuration?.id ??
        (await createConfigurationAndSync());

      await updateConfigurationOption({
        configurationId,
        optionGroupCode: groupCode,
        optionValueCode,
      });

      const updatedConfiguration =
        await getConfigurationDetails(
          configurationId
        );

      setConfiguration(
        updatedConfiguration
      );
    } catch (err) {
      console.error(
        "Option update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update option."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
  try {
    setLoading(true);
    setError("");
    setCartMessage("");
    addedSuccessRef.current = false;

    // Make sure the last option tap has actually reached the database
    // before we ask the server to freeze a price for it.
    if (pendingSaveRef.current) {
      await pendingSaveRef.current;
    }

    let configurationId = configuration?.id;

    // If customer hasn't opened the customizer yet,
    // create the default configuration first.
    if (!configurationId) {
      configurationId =
        await createDefaultConfiguration({
          productCode: product.product_code,
          sizeCode: selectedSize,
        });

      if (
        selectedMaterial &&
        selectedMaterial !== defaultMaterial
      ) {
        await updateConfigurationMaterial({
          configurationId,
          materialCode: selectedMaterial,
        });
      }

      if (
        selectedColor &&
        selectedColor !== defaultColor
      ) {
        await updateConfigurationColor({
          configurationId,
          colorCode: selectedColor,
        });
      }
    }

    // Validate + freeze price + move to CART
    await addConfigurationToCart(
      configurationId
    );

    // Reload so React knows status is CART
    const updatedConfiguration =
      await getConfigurationDetails(
        configurationId
      );

    setConfiguration(updatedConfiguration);
    setCartMessage("Added to cart ✓");
    setSelectedSize(updatedConfiguration.size);
    setSelectedMaterial(
      updatedConfiguration.material
    );
    setSelectedColor(updatedConfiguration.color);

    // Let the header badge (StoreShell) know to refresh its count, and
    // flag success for handleBuyNow below — both UI-only signals,
    // don't touch the cart logic above.
    addedSuccessRef.current = true;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    }
  } catch (err) {
    console.error("Add to cart error:", err);

    setError(friendlyAddToCartError(err));
  } finally {
    setLoading(false);
  }
}

  /* =========================================================
     MATERIAL CHANGE
     ========================================================= */

  async function handleMaterialChange(event) {
    const newMaterial =
      event.target.value;

    /*
     * Before configuration exists:
     * remember selection locally.
     */

    if (!configuration) {
      setSelectedMaterial(newMaterial);

      const freshColors = await refreshColorsForMaterial(newMaterial);
      const stillValid = freshColors.some(
        (c) => c.color_code === selectedColor
      );
      if (!stillValid) {
        setSelectedColor(
          freshColors.find((c) => c.is_default)?.color_code ??
            freshColors[0]?.color_code ??
            ""
        );
      }
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateConfigurationMaterial({
        configurationId:
          configuration.id,
        materialCode: newMaterial,
      });

      let updatedConfiguration =
        await getConfigurationDetails(
          configuration.id
        );

      setConfiguration(
        updatedConfiguration
      );

      setSelectedMaterial(
        updatedConfiguration.material
      );

      // Colors are material-scoped — if the current color isn't in
      // the new material's palette, fall back to that palette's
      // default (both in the UI and in the saved configuration).
      const freshColors = await refreshColorsForMaterial(
        updatedConfiguration.material
      );
      const stillValid = freshColors.some(
        (c) => c.color_code === updatedConfiguration.color
      );
      if (!stillValid) {
        const fallbackColor =
          freshColors.find((c) => c.is_default)?.color_code ??
          freshColors[0]?.color_code ??
          null;

        if (fallbackColor) {
          await updateConfigurationColor({
            configurationId: updatedConfiguration.id,
            colorCode: fallbackColor,
          });
          updatedConfiguration = await getConfigurationDetails(
            updatedConfiguration.id
          );
          setConfiguration(updatedConfiguration);
        }
      }

      setSelectedColor(updatedConfiguration.color);
    } catch (err) {
      console.error(
        "Material update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update material."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     COLOR CHANGE
     ========================================================= */

  async function handleColorChange(event) {
    const newColor =
      event.target.value;

    /*
     * Before configuration exists:
     * remember selection locally.
     */

    if (!configuration) {
      setSelectedColor(newColor);
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateConfigurationColor({
        configurationId:
          configuration.id,
        colorCode: newColor,
      });

      const updatedConfiguration =
        await getConfigurationDetails(
          configuration.id
        );

      setConfiguration(
        updatedConfiguration
      );

      setSelectedColor(
        updatedConfiguration.color
      );
    } catch (err) {
      console.error(
        "Color update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update color."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     SIZE CHANGE
     ========================================================= */

  async function handleSaveMeasurements() {
    
  const chestCm = Number(customMeasurements.chest);
  const waistCm = Number(customMeasurements.waist);
  const hipCm = Number(customMeasurements.hip);

  if (
    !Number.isFinite(chestCm) ||
    !Number.isFinite(waistCm) ||
    !Number.isFinite(hipCm) ||
    chestCm <= 0 ||
    waistCm <= 0 ||
    hipCm <= 0
  ) {
    setError(
      "Please enter valid Chest, Waist, and Hip measurements."
    );
    return;
  }

  /*
   * Customer enters centimeters.
   * Database stores canonical measurements
   * as integer millimeters.
   */

  const chestMm = Math.round(chestCm * 10);
  const waistMm = Math.round(waistCm * 10);
  const hipMm = Math.round(hipCm * 10);

  try {
    setLoading(true);
    setError("");

    await updateConfigurationMeasurements(
      configuration.id,
      {
        chestMm,
        waistMm,
        hipMm,
      }
    );

    /*
     * The RPC recalculates pricing in Supabase.
     * Reload configuration so React receives
     * the new pricing values.
     */

    const updatedConfiguration =
      await getConfigurationDetails(
        configuration.id
      );

    setConfiguration(updatedConfiguration);
  } catch (err) {
    console.error(
      "Measurement update error:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Unable to save measurements."
    );
  } finally {
    setLoading(false);
  }
}

async function handleMeasurementModeChange(newMode) {
  /*
   * Switching to CUSTOM only changes the UI.
   * Measurements are attached when the customer
   * clicks Save Measurements.
   */

  if (newMode === "CUSTOM") {
    setMeasurementMode("CUSTOM");
    setError("");
    return;
  }

  /*
   * No database configuration exists yet,
   * so STANDARD is only local state.
   */

  if (!configuration) {
    setMeasurementMode("STANDARD");
    setError("");
    return;
  }

  /*
   * Existing configuration:
   * detach custom measurements and restore
   * standard-size pricing.
   */

  try {
    setLoading(true);
    setError("");

    await useStandardConfigurationSize(
      configuration.id
    );

    const updatedConfiguration =
      await getConfigurationDetails(
        configuration.id
      );

    setConfiguration(updatedConfiguration);

    setSelectedSize(
      updatedConfiguration.size
    );

    setMeasurementMode("STANDARD");
  } catch (err) {
    console.error(
      "Measurement mode update error:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Unable to switch to standard sizing."
    );
  } finally {
    setLoading(false);
  }
}

  async function handleSizeChange(event) {
    const newSize =
      event.target.value;

    /*
     * No configuration yet:
     *
     * update local selection and calculate
     * the read-only default product price.
     */

    if (!configuration) {
      setSelectedSize(newSize);

      try {
        setError("");

        const price =
          await getDefaultProductPrice({
            productCode:
              product.product_code,
            sizeCode: newSize,
          });

        setPreviewPrice(price);
      } catch (err) {
        console.error(
          "Default price error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to calculate price."
        );
      }

      return;
    }

    /*
     * Existing configuration:
     * persist size to Supabase.
     */

    try {
      setLoading(true);
      setError("");

      await updateConfigurationSize({
        configurationId:
          configuration.id,
        sizeCode: newSize,
      });

      const updatedConfiguration =
        await getConfigurationDetails(
          configuration.id
        );

      setConfiguration(
        updatedConfiguration
      );

      setSelectedSize(
        updatedConfiguration.size
      );
    } catch (err) {
      console.error(
        "Size update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update size."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD COMPATIBILITY RULES

     Every time the selected structural options change,
     ask Supabase which compatibility rules are active.
     ========================================================= */

  useEffect(() => {
    if (!configuration?.id) {
      setUiRules([]);
      return;
    }

    let cancelled = false;

    async function loadUiRules() {
      try {
        const rules =
          await getConfigurationUiRules(
            configuration.id
          );

        if (!cancelled) {
          setUiRules(rules ?? []);
        }
      } catch (err) {
        console.error(
          "Unable to load compatibility rules:",
          err
        );

        if (!cancelled) {
          setUiRules([]);
        }
      }
    }

    loadUiRules();

    return () => {
      cancelled = true;
    };
  }, [
    configuration?.id,
    configuration?.options?.FIT,
    configuration?.options?.COLLAR,
    configuration?.options?.SLEEVE,
    configuration?.options?.POCKET,
    configuration?.options?.PLACKET,
  ]);

  /* =========================================================
     COMPATIBILITY HELPER
     ========================================================= */

  function isOptionDisabled(
    optionGroupCode,
    optionValueCode
  ) {
    return uiRules.some(
      (rule) =>
        rule.rule_type === "EXCLUDES" &&
        rule.target_option_group_code ===
          optionGroupCode &&
        rule.target_option_value_code ===
          optionValueCode
    );
  }

  /* =========================================================
     PRICE
     ========================================================= */

  // Prefer the instant local computation (zero latency, recomputes on
  // every tap) over whatever the backend last confirmed — falls back
  // to the old behavior if the pricing manifest hasn't loaded yet.
  // handleAddToCart below re-fetches the authoritative server price
  // before anything is actually charged, regardless of what's shown here.
  const displayedPrice =
    localPrice?.sellingPrice ??
    (configuration?.pricing?.sellingPrice
      ? configuration.pricing.sellingPrice
      : previewPrice?.selling_price);

  /* =========================================================
     RENDER
     ========================================================= */

  const isCustomizing = loading;
  const hasDiscount = configuration?.pricing?.maxDiscountAmount > 0;
  const addedSuccess = Boolean(cartMessage) && !error;

  /* =========================================================
     "JUST UPDATED" FEEDBACK (UI-only — purely visual, no effect
     on configuration logic above). Fires a brief gold pulse +
     an "Updated" chip on the gallery whenever a selection is
     tapped, so the change is obvious without scrolling back up.
     ========================================================= */
  const [justUpdated, setJustUpdated] = useState(false);
  const pulseTimeoutRef = useRef(null);

  function pulseGallery() {
    setJustUpdated(true);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => setJustUpdated(false), 900);
  }

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  // Auto-clear the success message after a moment so the "Added" button
  // state doesn't stay stuck — purely a UI timeout, doesn't touch
  // handleAddToCart itself.
  useEffect(() => {
    if (!cartMessage || error) return;
    const timeoutId = setTimeout(() => setCartMessage(""), 1800);
    return () => clearTimeout(timeoutId);
  }, [cartMessage, error]);

  // Track whether the main gallery has scrolled out of view, so the
  // small floating thumbnail can appear in its place (mobile/tablet).
  const galleryAnchorRef = useRef(null);
  const [galleryOutOfView, setGalleryOutOfView] = useState(false);

  useEffect(() => {
    const node = galleryAnchorRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setGalleryOutOfView(!entry.isIntersecting),
      { rootMargin: "-110px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function withPulse(handler) {
    return (...args) => {
      pulseGallery();
      handler(...args);
    };
  }

  /* =========================================================
     BUY NOW — adds to cart (same handleAddToCart above, no
     Shopify checkout integration exists yet, see the project
     notes) then takes the customer straight to the bag.
     ========================================================= */
  const router = useRouter();
  const addedSuccessRef = useRef(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  async function handleBuyNow() {
    setBuyNowLoading(true);
    await handleAddToCart();
    setBuyNowLoading(false);
    if (addedSuccessRef.current) {
      router.push("/cart");
    }
  }

  return (
    <section className="pb-28 lg:pb-8">
      {/* ===================================================
          MOBILE-FIRST GRID: gallery, then info panel
          =================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-10 px-4 sm:px-6 lg:px-0 pt-4">
        {/* ---------- GALLERY ----------
            Before Customize is tapped: real Shopify photos (if this
            page has them). After: the live, instantly-updating
            render. Same option UI is visible the whole time below —
            only the image source changes. */}
        {/* On desktop the image column sticks beside the options while
            you scroll, so every change stays visible. */}
        <div ref={galleryAnchorRef} className="lg:sticky lg:top-24 lg:self-start">
          {!showLive && shopifyProduct ? (
            <ShopifyGallery
              images={shopifyProduct.images?.nodes ?? []}
              title={shopifyProduct.title}
            />
          ) : (
            <ProductGallery
              badgeLabel="Made To Order"
              isBusy={isCustomizing}
              justUpdated={justUpdated}
            >
              <ShirtCustomizer
                manifest={manifest}
                selection={draftSelection}
                colorHex={getColorHex(selectedColor)}
              />
            </ProductGallery>
          )}
        </div>

        {/* Small floating thumbnail that appears once the main image
            scrolls out of view — shrinks along with you instead of
            pinning the full-size image in place. Only once there's a
            live render to show (post-customize). */}
        <FloatingPreview
          visible={showLive && galleryOutOfView}
          justUpdated={justUpdated}
          onTap={() =>
            galleryAnchorRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          <ShirtCustomizer
            manifest={manifest}
            selection={draftSelection}
            colorHex={getColorHex(selectedColor)}
          />
        </FloatingPreview>

        {/* ---------- INFO PANEL ---------- */}
        <div className="om-stagger flex flex-col gap-6">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--color-gold-bright)] mb-1">
              Made To Order
            </p>
            <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl leading-tight">
              {shopifyProduct?.title || product.product_name}
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-faint)]">
              Product code: {product.product_code}
            </p>
            {!showLive && shopifyProduct?.descriptionHtml && (
              <div
                className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed [&_p]:mb-2"
                dangerouslySetInnerHTML={{
                  __html: shopifyProduct.descriptionHtml,
                }}
              />
            )}
          </div>

          {/* PRICE */}
          <div>
            <div className="flex items-baseline gap-3">
              <span
                key={displayedPrice}
                className="animate-pop-in font-[var(--font-display)] text-3xl text-[var(--color-gold-bright)]"
              >
                {displayedPrice
                  ? `₹${Number(displayedPrice).toLocaleString("en-IN")}`
                  : "—"}
              </span>
              {!displayedPrice && (
                <span className="text-xs text-[var(--color-text-faint)]">
                  Calculating price…
                </span>
              )}
            </div>

            {hasDiscount && (
              <div className="mt-1.5 text-xs">
                <span className="text-[var(--color-success)]">
                  Up to ₹
                  {Number(
                    configuration.pricing.maxDiscountAmount
                  ).toLocaleString("en-IN")}{" "}
                  discount available
                </span>
                <span className="text-[var(--color-text-faint)]">
                  {" "}
                  · up to{" "}
                  {Number(configuration.pricing.maxDiscountPercent).toFixed(1)}
                  % off
                </span>
              </div>
            )}
          </div>

          {/* SIZING METHOD */}
          <div>
            <p className="text-sm font-medium mb-2">Sizing Method</p>
            <div className="inline-flex rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-1">
              {[
                { key: "STANDARD", label: "Standard Size" },
                { key: "CUSTOM", label: "Custom Measurements" },
              ].map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  disabled={loading}
                  onClick={() => handleMeasurementModeChange(mode.key)}
                  className={[
                    "om-tap rounded-full px-4 py-2 text-xs font-medium transition-colors",
                    measurementMode === mode.key
                      ? "bg-[var(--color-gold)] text-[var(--color-gold-contrast)]"
                      : "text-[var(--color-text-muted)]",
                  ].join(" ")}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* SIZE CHIPS */}
          {measurementMode === "STANDARD" && (
            <div>
              <p className="text-sm font-medium mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <Chip
                    key={size.size_code}
                    active={
                      (configuration ? configuration.size : selectedSize) ===
                      size.size_code
                    }
                    busy={loading}
                    onClick={withPulse(() =>
                      handleSizeChange({ target: { value: size.size_code } })
                    )}
                  >
                    {size.size_code}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM MEASUREMENTS */}
          {measurementMode === "CUSTOM" && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 animate-fade-up">
              <p className="text-sm font-medium">Custom Measurements</p>
              <p className="text-xs text-[var(--color-text-faint)] mt-1 mb-3">
                Enter your body measurements in centimeters.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "chest", label: "Chest" },
                  { key: "waist", label: "Waist" },
                  { key: "hip", label: "Hip" },
                ].map((field) => (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {field.label} (cm)
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={customMeasurements[field.key]}
                      disabled={loading}
                      onChange={(event) =>
                        setCustomMeasurements((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-2 text-sm outline-none focus:border-[var(--color-gold)]"
                    />
                  </label>
                ))}
              </div>

              <Button
                variant="secondary"
                className="mt-4 !px-5 !py-2.5 !text-sm"
                loading={loading}
                onClick={handleSaveMeasurements}
              >
                Save Measurements
              </Button>
            </div>
          )}

          {/* MATERIAL — locked until Customize is tapped */}
          <div>
            <p className="text-sm font-medium mb-2">
              Material
            </p>
            <div className="flex flex-wrap gap-2">
              {materials.map((material) => (
                <Chip
                  key={material.material_code}
                  busy={loading}
                  active={
                    (configuration
                      ? configuration.material
                      : selectedMaterial) === material.material_code
                  }
                  onClick={withStart(
                    withPulse(() =>
                      handleMaterialChange({
                        target: { value: material.material_code },
                      })
                    )
                  )}
                >
                  {material.material_code}
                </Chip>
              ))}
            </div>
          </div>

          {/* COLOR — locked until Customize is tapped */}
          <div>
            <p className="text-sm font-medium mb-2">
              Color
            </p>
            <div className="flex flex-wrap gap-3">
              {colorList.map((color) => (
                <ColorSwatch
                  key={color.color_code}
                  title={color.color_code}
                  hex={getColorHex(color.color_code)}
                  busy={loading}
                  active={
                    (configuration ? configuration.color : selectedColor) ===
                    color.color_code
                  }
                  onClick={withStart(
                    withPulse(() =>
                      handleColorChange({
                        target: { value: color.color_code },
                      })
                    )
                  )}
                />
              ))}
            </div>
          </div>

          {/* CUSTOMIZATION OPTIONS */}
          <div ref={optionsSectionRef} className="scroll-mt-28">
            <p className="text-sm font-medium mb-3">Customize</p>
            <div className="flex flex-col gap-3">
              {Object.entries(options).map(([groupCode, groupOptions]) => {
                const defaultOption = groupOptions.find(
                  (option) => option.is_default
                )?.option_value_code;

                // Reads from draftSelection (instant, local) rather than
                // configuration?.options — so the active chip updates the
                // moment it's tapped, not after the backend round-trip.
                const activeValue =
                  draftSelection[groupCode] ?? defaultOption ?? "";

                const GroupIcon = OPTION_GROUP_ICONS[groupCode] ?? FabricIcon;

                return (
                  <div key={groupCode}>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                      {formatOptionLabel(groupCode)}
                    </p>
                    {/* Wrapping grid — every option is always visible,
                        nothing hidden behind a horizontal scroll. */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {groupOptions.map((option) => {
                        const disabled = isOptionDisabled(
                          groupCode,
                          option.option_value_code
                        );
                        return (
                          <OptionSwatchCard
                            key={option.option_value_code}
                            label={formatOptionLabel(option.option_value_code)}
                            icon={GroupIcon}
                            title={
                              disabled ? "Unavailable with current options" : undefined
                            }
                            disabled={disabled}
                            busy={loading}
                            active={activeValue === option.option_value_code}
                            onClick={withStart(
                              withDraftUpdate(
                                groupCode,
                                option.option_value_code,
                                withPulse(() =>
                                  handleOptionChange(
                                    groupCode,
                                    option.option_value_code
                                  )
                                )
                              )
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FeatureRow />

          {/* ERROR / STATUS */}
          {error && (
            <div className="rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)] animate-pop-in">
              {error}
            </div>
          )}
          {cartMessage && !error && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)] animate-pop-in">
              <CheckIcon size={16} />
              {cartMessage}
            </div>
          )}

          {/* DESKTOP ACTION ROW (hidden on mobile — sticky bar takes over).
              Customize and Add to Bag / Buy Now are always available
              together — adding without customizing uses the current
              size/material/color selection as a quick default. */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="secondary"
              loading={loading && !configuration}
              onClick={handleCustomize}
            >
              {showLive ? "Customizing ✓" : "Customize"}
            </Button>
            <Button
              variant="ghost"
              loading={loading && buyNowLoading}
              onClick={handleBuyNow}
              fullWidth
            >
              Buy Now
            </Button>
            <Button
              variant="primary"
              loading={loading && !buyNowLoading}
              onClick={handleAddToCart}
              fullWidth
              className={addedSuccess ? "animate-pulse-ring" : ""}
            >
              {addedSuccess ? (
                <>
                  <CheckIcon size={16} /> Added
                </>
              ) : (
                "Add to Bag"
              )}
            </Button>
          </div>

          <ShippingRow />
        </div>
      </div>

      <div className="mt-10 px-4 sm:px-6 lg:px-0">
        <RelatedProducts />
      </div>

      {/* ===================================================
          MOBILE STICKY ACTION BAR
          =================================================== */}
      <div className="animate-fade-up lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-[var(--color-text-faint)]">
            Price
          </span>
          <span
            key={displayedPrice}
            className="animate-pop-in font-[var(--font-display)] text-lg text-[var(--color-gold-bright)]"
          >
            {displayedPrice
              ? `₹${Number(displayedPrice).toLocaleString("en-IN")}`
              : "—"}
          </span>
        </div>
        <Button
          variant="secondary"
          loading={loading && !buyNowLoading && !configuration}
          onClick={handleCustomize}
          className="!py-3 !px-4"
        >
          {showLive ? "Options" : "Customize"}
        </Button>
        <Button
          variant="ghost"
          loading={loading && buyNowLoading}
          onClick={handleBuyNow}
          className="!py-3 !px-4"
        >
          Buy
        </Button>
        <Button
          variant="primary"
          loading={loading && !buyNowLoading}
          onClick={handleAddToCart}
          fullWidth
          className={`!py-3 ${addedSuccess ? "animate-pulse-ring" : ""}`}
        >
          {addedSuccess ? (
            <>
              <CheckIcon size={16} /> Added
            </>
          ) : (
            "Add to Bag"
          )}
        </Button>
      </div>
    </section>
  );
}