"use client";

import { useEffect, useState } from "react";

import ProductDetails from "@/components/product/ProductDetails";

import {
  getProductByCode,
  getProductSizes,
  getProductOptions,
  getProductMaterials,
  getProductColors,
  getDefaultProductPrice,
} from "@/services/productService";

type ProductSize = {
  size_code: string;
  sort_order: number;
};

type ProductOption = {
  option_group_code: string;
  option_value_code: string;
  is_default: boolean;
};

type ProductMaterial = {
  material_code: string;
  is_default: boolean;
};

type ProductColor = {
  color_code: string;
  is_default: boolean;
};

type ProductPrice = {
  selling_price: string;
  protected_price_floor: string;
  max_discount_amount: string;
  max_discount_percent: string;
};

function groupProductOptions(options: ProductOption[]) {
  return options.reduce<Record<string, ProductOption[]>>(
    (groups, option) => {
      const groupCode = option.option_group_code;

      if (!groups[groupCode]) {
        groups[groupCode] = [];
      }

      groups[groupCode].push(option);

      return groups;
    },
    {}
  );
}

export default function Home() {
  const [product, setProduct] = useState<any>(null);

  const [sizes, setSizes] = useState<ProductSize[]>([]);

  const [options, setOptions] = useState<ProductOption[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const groupedOptions = groupProductOptions(options);

  const [materials, setMaterials] =
  useState<ProductMaterial[]>([]);

  const [colors, setColors] =
  useState<ProductColor[]>([]);

  const [defaultPrice, setDefaultPrice] =
  useState<ProductPrice | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const productCode = "WHITE_COTTON_SHIRT";

        const productData =
          await getProductByCode(productCode);

        const sizeData =
          await getProductSizes(productCode);

        const optionData =
          await getProductOptions(productCode);

        const materialData = await getProductMaterials(productCode);

        const colorData = await getProductColors(productCode);

        const priceData = await getDefaultProductPrice({
  productCode: "WHITE_COTTON_SHIRT",
  sizeCode: "M",
});


        console.log("Product:", productData);
        console.log("Sizes:", sizeData);
        console.log("Options:", optionData);
        console.log("COLOR DATA:", colorData);

        setProduct(productData);
        setSizes(sizeData);
        setOptions(optionData);
        setMaterials(materialData);
        setColors(colorData);
        setDefaultPrice(priceData);
      } catch (err) {
        console.error("Product loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, []);

  if (loading) {
    return (
      <main>
        <h1>MainReact Store</h1>
        <p>Loading product...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>MainReact Store</h1>
        <p>Error: {error}</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <h1>MainReact Store</h1>
        <p>Product not found.</p>
      </main>
    );
  }

  return (
  <main>
    <h1>MainReact Store</h1>

  <ProductDetails
  product={product}
  sizes={sizes}
  options={groupedOptions}
  materials={materials}
  colors={colors}
  defaultPrice={defaultPrice}
/>
  </main>
);
}