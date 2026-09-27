"use client";

import { useEffect, useState } from "react";

import { getDefaultProductPrice } from "@/services/productService";
import ShirtCustomizer from "@/components/customizer/ShirtCustomizer";

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
  colors,
  defaultPrice,
}) {
  /* =========================================================
     DEFAULT VALUES
     ========================================================= */

  const defaultMaterial =
    materials.find(
      (material) => material.is_default
    )?.material_code ?? "";

  const defaultColor =
    colors.find(
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

  async function handleCustomize() {
    if (configuration) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const configurationId =
        await createDefaultConfiguration({
          productCode: product.product_code,
          sizeCode: selectedSize,
        });

      /*
       * createDefaultConfiguration creates the
       * product's database defaults.
       *
       * If the customer changed material before
       * clicking Customize, apply that selection.
       */

      if (
        selectedMaterial &&
        selectedMaterial !== defaultMaterial
      ) {
        await updateConfigurationMaterial({
          configurationId,
          materialCode: selectedMaterial,
        });
      }

      /*
       * Apply pre-selected color too.
       */

      if (
        selectedColor &&
        selectedColor !== defaultColor
      ) {
        await updateConfigurationColor({
          configurationId,
          colorCode: selectedColor,
        });
      }

      const configurationDetails =
        await getConfigurationDetails(
          configurationId
        );

      setConfiguration(configurationDetails);

      setSelectedSize(
        configurationDetails.size
      );

      setSelectedMaterial(
        configurationDetails.material
      );

      setSelectedColor(
        configurationDetails.color
      );
    } catch (err) {
      console.error(
        "Configuration error:",
        err
      );

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
    if (!configuration) {
      setError(
        "Click Customize Shirt before changing garment options."
      );

      return;
    }

    /*
     * Extra frontend guard.
     *
     * The disabled <option> should normally prevent this,
     * but we also protect the handler itself.
     */

    if (
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

      await updateConfigurationOption({
        configurationId: configuration.id,
        optionGroupCode: groupCode,
        optionValueCode,
      });

      const updatedConfiguration =
        await getConfigurationDetails(
          configuration.id
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
  } catch (err) {
    console.error("Add to cart error:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to add item to cart."
    );
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

      const updatedConfiguration =
        await getConfigurationDetails(
          configuration.id
        );

      setConfiguration(
        updatedConfiguration
      );

      setSelectedMaterial(
        updatedConfiguration.material
      );
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

  const displayedPrice =
    configuration?.pricing?.sellingPrice
      ? configuration.pricing.sellingPrice
      : previewPrice?.selling_price;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <section>
      <h1>{product.product_name}</h1>

      <p>
        Product Code:{" "}
        {product.product_code}
      </p>

      {/* ===================================================
    MEASUREMENT MODE
    =================================================== */}

<div>
  <strong>Choose Sizing Method</strong>

  <div>
    <label>
      <input
        type="radio"
        name="measurementMode"
        value="STANDARD"
        checked={measurementMode === "STANDARD"}
        onChange={() =>
          handleMeasurementModeChange("STANDARD")
        }
        disabled={loading}
      />

      Standard Size
    </label>

    <label>
      <input
        type="radio"
        name="measurementMode"
        value="CUSTOM"
        checked={measurementMode === "CUSTOM"}
        onChange={() =>
          handleMeasurementModeChange("CUSTOM")
        }
        disabled={loading}
      />

      Custom Measurements
    </label>
  </div>
</div>

      {/* ===================================================
          SIZE
          =================================================== */}

      {measurementMode === "STANDARD" && (
  <div>
    <label htmlFor="size">
      <strong>Size</strong>
    </label>

    <select
      id="size"
      value={
        configuration
          ? configuration.size
          : selectedSize
      }
      onChange={handleSizeChange}
      disabled={loading}
    >
      {sizes.map((size) => (
        <option
          key={size.size_code}
          value={size.size_code}
        >
          {size.size_code}
        </option>
      ))}
    </select>
  </div>
)}

{measurementMode === "CUSTOM" && (
  <div>
    <h3>Custom Measurements</h3>

    <p>
      Enter your body measurements in centimeters.
    </p>

    <div>
      <label htmlFor="chest">
        <strong>Chest (cm)</strong>
      </label>

      <input
        id="chest"
        type="number"
        min="1"
        step="0.1"
        value={customMeasurements.chest}
        onChange={(event) =>
          setCustomMeasurements((current) => ({
            ...current,
            chest: event.target.value,
          }))
        }
        disabled={loading}
      />
    </div>

    <div>
      <label htmlFor="waist">
        <strong>Waist (cm)</strong>
      </label>

      <input
        id="waist"
        type="number"
        min="1"
        step="0.1"
        value={customMeasurements.waist}
        onChange={(event) =>
          setCustomMeasurements((current) => ({
            ...current,
            waist: event.target.value,
          }))
        }
        disabled={loading}
      />
    </div>

    <div>
      <label htmlFor="hip">
        <strong>Hip (cm)</strong>
      </label>

      <input
        id="hip"
        type="number"
        min="1"
        step="0.1"
        value={customMeasurements.hip}
        onChange={(event) =>
          setCustomMeasurements((current) => ({
            ...current,
            hip: event.target.value,
          }))
        }
        disabled={loading}
      />
    </div>

    <button
  type="button"
  onClick={handleSaveMeasurements}
  disabled={loading}
>
  {loading
    ? "Saving..."
    : "Save Measurements"}
</button>
  </div>
)}

      {/* ===================================================
          PRICE
          =================================================== */}

      <div>
        <strong>Price: </strong>

        {displayedPrice
          ? `₹${Number(
              displayedPrice
            ).toLocaleString("en-IN")}`
          : "Loading price..."}
      </div>

      {configuration?.pricing?.maxDiscountAmount > 0 && (
  <div
    style={{
      marginTop: "8px",
      fontSize: "14px",
    }}
  >
    <div>
      Up to{" "}
      <strong>
        ₹
        {Number(
          configuration.pricing.maxDiscountAmount
        ).toLocaleString("en-IN")}
      </strong>{" "}
      discount available
    </div>

    <div
      style={{
        marginTop: "2px",
        opacity: 0.7,
        fontSize: "13px",
      }}
    >
      Up to{" "}
      {Number(
        configuration.pricing.maxDiscountPercent
      ).toFixed(1)}
      % off
    </div>
  </div>
)}

      {/* ===================================================
          MATERIAL
          =================================================== */}

      <div>
        <label htmlFor="material">
          <strong>Material</strong>
        </label>

        <select
          id="material"
          value={
            configuration
              ? configuration.material
              : selectedMaterial
          }
          onChange={
            handleMaterialChange
          }
          disabled={loading}
        >
          {materials.map(
            (material) => (
              <option
                key={
                  material.material_code
                }
                value={
                  material.material_code
                }
              >
                {
                  material.material_code
                }
              </option>
            )
          )}
        </select>
      </div>

      {/* ===================================================
          COLOR
          =================================================== */}

      <div>
        <label htmlFor="color">
          <strong>Color</strong>
        </label>

        <select
          id="color"
          value={
            configuration
              ? configuration.color
              : selectedColor
          }
          onChange={handleColorChange}
          disabled={loading}
        >
          {colors.map((color) => (
            <option
              key={color.color_code}
              value={color.color_code}
            >
              {color.color_code}
            </option>
          ))}
        </select>
      </div>

      {/* ===================================================
          SHIRT VISUAL
          =================================================== */}

      <ShirtCustomizer
        configuration={configuration}
      />

      {/* ===================================================
          CUSTOMIZATION OPTIONS
          =================================================== */}

      <div>
        <h2>Customize</h2>

        {Object.entries(options).map(
          ([
            groupCode,
            groupOptions,
          ]) => {
            const defaultOption =
              groupOptions.find(
                (option) =>
                  option.is_default
              )?.option_value_code;

            const currentValue =
              configuration?.options?.[
                groupCode
              ];

            return (
              <div key={groupCode}>
                <label
                  htmlFor={
                    groupCode
                  }
                >
                  <strong>
                    {groupCode}
                  </strong>
                </label>

                <select
                  id={groupCode}
                  value={
                    currentValue ??
                    defaultOption ??
                    ""
                  }
                  disabled={
                    !configuration ||
                    loading
                  }
                  onChange={(event) =>
                    handleOptionChange(
                      groupCode,
                      event.target.value
                    )
                  }
                >
                  {groupOptions.map(
                    (option) => {
                      const disabled =
                        isOptionDisabled(
                          groupCode,
                          option.option_value_code
                        );

                      return (
                        <option
                          key={
                            option.option_value_code
                          }
                          value={
                            option.option_value_code
                          }
                          disabled={
                            disabled
                          }
                        >
                          {
                            option.option_value_code
                          }
                          {disabled
                            ? " — Unavailable"
                            : ""}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>
            );
          }
        )}
      </div>

      <br />

      <button
  type="button"
  onClick={handleAddToCart}
  disabled={loading}
  style={{
    marginTop: "12px",
    padding: "12px 20px",
    cursor: loading ? "not-allowed" : "pointer",
  }}
>
  {loading ? "Please wait..." : "Add to Cart"}
</button>

{cartMessage && (
  <div
    style={{
      marginTop: "10px",
      fontWeight: "600",
    }}
  >
    {cartMessage}
  </div>
)}

      {/* ===================================================
          CUSTOMIZE BUTTON
          =================================================== */}

      {!configuration && (
        <button
          type="button"
          onClick={handleCustomize}
          disabled={loading}
        >
          {loading
            ? "Working..."
            : "Customize Shirt"}
        </button>
      )}

      {configuration && (
        <p>
          Customization active.
        </p>
      )}

      {/* ===================================================
          ERROR
          =================================================== */}

      {error && (
        <p>
          <strong>Error:</strong>{" "}
          {error}
        </p>
      )}

      {/* ===================================================
          CURRENT CONFIGURATION
          TEMPORARY DEVELOPMENT DISPLAY
          =================================================== */}

      {configuration && (
        <div>
          <h2>
            Current Configuration
          </h2>

          <p>
            <strong>Size:</strong>{" "}
            {configuration.size}
          </p>

          <p>
            <strong>
              Material:
            </strong>{" "}
            {configuration.material}
          </p>

          <p>
            <strong>Color:</strong>{" "}
            {configuration.color}
          </p>

          <p>
            <strong>Fit:</strong>{" "}
            {
              configuration.options
                ?.FIT
            }
          </p>

          <p>
            <strong>
              Collar:
            </strong>{" "}
            {
              configuration.options
                ?.COLLAR
            }
          </p>

          <p>
            <strong>
              Sleeve:
            </strong>{" "}
            {
              configuration.options
                ?.SLEEVE
            }
          </p>

          <p>
            <strong>
              Pocket:
            </strong>{" "}
            {
              configuration.options
                ?.POCKET
            }
          </p>

          <p>
            <strong>
              Placket:
            </strong>{" "}
            {
              configuration.options
                ?.PLACKET
            }
          </p>
        </div>
      )}
    </section>
  );
}