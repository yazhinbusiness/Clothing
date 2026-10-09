"use client";

import { useState } from "react";

import {
  createDefaultConfiguration,
  getConfigurationDetails,
} from "@/services/configurationService";

export default function SupabaseTest() {
  const [message, setMessage] = useState(
    "Ready to create configuration."
  );

  const [configuration, setConfiguration] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateConfiguration() {
    try {
      setLoading(true);
      setConfiguration(null);
      setMessage("Creating configuration...");

      // 1. Create configuration
      const configurationId =
        await createDefaultConfiguration({
          productCode: "WHITE_COTTON_SHIRT",
          sizeCode: "M",
        });

      // 2. Load configuration details
      const configurationData =
        await getConfigurationDetails(configurationId);

      // 3. Store in React state
      setConfiguration(configurationData);

      setMessage("Configuration loaded successfully!");
    } catch (error) {
      console.error("Configuration error:", error);

      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Configuration Test</h2>

      <p>{message}</p>

      <button
        onClick={handleCreateConfiguration}
        disabled={loading}
      >
        {loading
          ? "Loading..."
          : "Create & Load Configuration"}
      </button>

      {configuration && (
        <div>
          <p>
            <strong>Configuration ID:</strong>{" "}
            {configuration.id}
          </p>

          <h3>{configuration.product.name}</h3>

          <p>
            <strong>Status:</strong>{" "}
            {configuration.status}
          </p>

          <p>
            <strong>Size:</strong> {configuration.size}
          </p>

          <p>
            <strong>Material:</strong>{" "}
            {configuration.material}
          </p>

          <p>
            <strong>Color:</strong>{" "}
            {configuration.color}
          </p>

          <h4>Customization</h4>

          <p>
            <strong>Fit:</strong>{" "}
            {configuration.options.FIT}
          </p>

          <p>
            <strong>Collar:</strong>{" "}
            {configuration.options.COLLAR}
          </p>

          <p>
            <strong>Sleeve:</strong>{" "}
            {configuration.options.SLEEVE}
          </p>

          <p>
            <strong>Pocket:</strong>{" "}
            {configuration.options.POCKET}
          </p>

          <p>
            <strong>Placket:</strong>{" "}
            {configuration.options.PLACKET}
          </p>
        </div>
      )}
    </div>
  );
}