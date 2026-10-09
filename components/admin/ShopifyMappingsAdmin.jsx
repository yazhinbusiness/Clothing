"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { saveMappingAction, deleteMappingAction } from "@/app/admin/shopify-mappings/actions";
import {
  getProductMaterials,
  getProductColors,
} from "@/services/productService";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]";

export default function ShopifyMappingsAdmin({
  shopifyProducts,
  productMasters,
  mappings,
}) {
  const [accessCode, setAccessCode] = useState("");
  const [editing, setEditing] = useState(null); // existing mapping row, or null for "new"
  const [selectedShopifyId, setSelectedShopifyId] = useState("");
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function loadOptionsFor(productCode) {
    setSelectedProductCode(productCode);
    setMaterials([]);
    setColors([]);
    if (!productCode) return;

    setLoadingOptions(true);
    try {
      const [materialData, colorData] = await Promise.all([
        getProductMaterials(productCode),
        getProductColors(productCode),
      ]);
      setMaterials(materialData);
      setColors(colorData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOptions(false);
    }
  }

  function startEdit(mapping) {
    setEditing(mapping);
    setSelectedShopifyId(mapping.shopify_product_id);
    setFormError("");
    loadOptionsFor(mapping.product_code);
  }

  function startNew() {
    setEditing(null);
    setSelectedShopifyId("");
    setSelectedProductCode("");
    setMaterials([]);
    setColors([]);
    setFormError("");
  }

  async function handleSubmit(formData) {
    setFormError("");
    setPending(true);
    try {
      await saveMappingAction(formData);
      startNew();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("accessCode", accessCode);
    setPending(true);
    try {
      await deleteMappingAction(formData);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- FORM ---------- */}
      <form
        key={editing?.id ?? "new"}
        action={handleSubmit}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-4"
      >
        <h2 className="font-[var(--font-display)] text-xl">
          {editing ? `Edit mapping — ${editing.shopify_product_title}` : "Add mapping"}
        </h2>

        <Field label="Access code">
          <input
            type="password"
            name="accessCode"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Shopify product">
          <select
            value={selectedShopifyId}
            onChange={(e) => setSelectedShopifyId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Select a Shopify product…
            </option>
            {shopifyProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input type="hidden" name="shopifyProductId" value={selectedShopifyId} readOnly />
          <input
            type="hidden"
            name="shopifyProductTitle"
            value={shopifyProducts.find((p) => p.id === selectedShopifyId)?.title ?? ""}
            readOnly
          />
        </Field>

        <Field label="Supabase product (garment configuration)">
          <select
            name="productCode"
            value={selectedProductCode}
            onChange={(e) => loadOptionsFor(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Select a product_code…
            </option>
            {productMasters.map((p) => (
              <option key={p.product_code} value={p.product_code}>
                {p.product_name} ({p.product_code})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Default material override (optional)">
            <select
              name="defaultMaterialCode"
              defaultValue={editing?.default_material_code ?? ""}
              className={inputClass}
              disabled={!selectedProductCode || loadingOptions}
            >
              <option value="">Use product&apos;s own default</option>
              {materials.map((m) => (
                <option key={m.material_code} value={m.material_code}>
                  {m.material_code}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Default color override (optional)">
            <select
              name="defaultColorCode"
              defaultValue={editing?.default_color_code ?? ""}
              className={inputClass}
              disabled={!selectedProductCode || loadingOptions}
            >
              <option value="">Use product&apos;s own default</option>
              {colors.map((c) => (
                <option key={c.color_code} value={c.color_code}>
                  {c.color_code}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={editing?.is_active ?? true}
          />
          Active (shows &quot;Customize&quot; on the storefront)
        </label>

        {formError && (
          <p className="text-sm text-[var(--color-danger)]">{formError}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" loading={pending}>
            {editing ? "Save changes" : "Create mapping"}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={startNew}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* ---------- EXISTING MAPPINGS ---------- */}
      <div>
        <h2 className="font-[var(--font-display)] text-xl mb-3">
          Existing mappings
        </h2>
        {mappings.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No mappings yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {mappings.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {m.shopify_product_title ?? m.shopify_product_id}
                  </p>
                  <p className="text-[var(--color-text-faint)] text-xs mt-0.5">
                    → {m.product_code}
                    {m.default_material_code ? ` · ${m.default_material_code}` : ""}
                    {m.default_color_code ? ` · ${m.default_color_code}` : ""}
                    {!m.is_active ? " · inactive" : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" className="!px-3 !py-2 !text-xs" onClick={() => startEdit(m)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="!px-3 !py-2 !text-xs text-[var(--color-danger)]"
                    onClick={() => handleDelete(m.id)}
                    disabled={!accessCode}
                    title={!accessCode ? "Enter the access code above first" : undefined}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
