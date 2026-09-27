"use client";

import { useEffect, useState } from "react";
import {
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "../../services/configurationService";


export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function loadCart() {
      try {
        setLoading(true);
        setError("");

        const items = await getCartItems();

        setCartItems(items);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  async function handleRemove(cartItemId) {
  try {
    setRemovingId(cartItemId);
    setError("");

    await removeCartItem(cartItemId);

    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item.cart_item_id !== cartItemId
      )
    );
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setRemovingId(null);
  }
}

async function handleQuantityChange(item, newQuantity) {
  if (newQuantity < 1) {
    return;
  }

  try {
    setUpdatingId(item.cart_item_id);
    setError("");

    await updateCartItemQuantity(
      item.cart_item_id,
      newQuantity
    );

    setCartItems((currentItems) =>
      currentItems.map((cartItem) => {
        if (
          cartItem.cart_item_id !== item.cart_item_id
        ) {
          return cartItem;
        }

        return {
          ...cartItem,
          quantity: newQuantity,
          line_total:
            Number(cartItem.selling_price) * newQuantity,
        };
      })
    );
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setUpdatingId(null);
  }
}

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <p>Loading cart...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Cart</h1>
        <p>{error}</p>
      </main>
    );
  }

  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.line_total || 0),
    0
  );

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1>Your Cart</h1>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cartItems.map((item) => (
            <div
              key={item.cart_item_id}
              style={{
                borderBottom: "1px solid #ddd",
                padding: "24px 0",
              }}
            >
              <h2>{item.product_name}</h2>

             {item.measurement_mode === "CUSTOM" ? (
  <div style={{ marginTop: "12px" }}>
    <p>
      Measurements: <strong>Custom</strong>
    </p>

    {item.measurements?.map((measurement) => (
      <p key={measurement.code}>
        {measurement.name}:{" "}
        <strong>
          {Number(measurement.measurementMm) / 10} cm
        </strong>
      </p>
    ))}
  </div>
) : (
  <p>
    Standard Size: <strong>{item.size_code}</strong>
  </p>
)}

              <p>
                Material:{" "}
                <strong>{item.material_code}</strong>
              </p>

              <p>
                Color:{" "}
                <strong>{item.color_code}</strong>
              </p>

              {item.options?.length > 0 && (
  <div style={{ marginTop: "16px" }}>
    <strong>Customization:</strong>

    <div
      style={{
        marginTop: "8px",
        display: "grid",
        gap: "6px",
      }}
    >
      {item.options.map((option) => (
        <div key={option.groupCode}>
          {option.groupCode}:{" "}
          <strong>{option.valueName}</strong>
        </div>
      ))}
    </div>
  </div>
)}

             <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "16px 0",
  }}
>
  <span>Quantity:</span>

  <button
    type="button"
    onClick={() =>
      handleQuantityChange(
        item,
        Number(item.quantity) - 1
      )
    }
    disabled={
      item.quantity <= 1 ||
      updatingId === item.cart_item_id
    }
    style={{
      width: "36px",
      height: "36px",
      cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
    }}
  >
    −
  </button>

  <strong>{item.quantity}</strong>

  <button
    type="button"
    onClick={() =>
      handleQuantityChange(
        item,
        Number(item.quantity) + 1
      )
    }
    disabled={updatingId === item.cart_item_id}
    style={{
      width: "36px",
      height: "36px",
      cursor: "pointer",
    }}
  >
    +
  </button>
</div>

              <p>
                Price:{" "}
                <strong>
                  ₹
                  {Number(
                    item.selling_price
                  ).toLocaleString("en-IN")}
                </strong>
              </p>

              <p>
                Line Total:{" "}
                <strong>
                  ₹
                  {Number(
                    item.line_total
                  ).toLocaleString("en-IN")}
                </strong>
              </p>


              <button
  type="button"
  onClick={() => handleRemove(item.cart_item_id)}
  disabled={removingId === item.cart_item_id}
  style={{
    marginTop: "12px",
    padding: "10px 16px",
    cursor:
      removingId === item.cart_item_id
        ? "not-allowed"
        : "pointer",
  }}
>
  {removingId === item.cart_item_id
    ? "Removing..."
    : "Remove"}
</button>
            </div>
          ))}

          <div
            style={{
              marginTop: "32px",
              textAlign: "right",
            }}
          >
            <h2>
              Total: ₹
              {cartTotal.toLocaleString("en-IN")}
            </h2>
          </div>
        </>
      )}
    </main>
  );
}