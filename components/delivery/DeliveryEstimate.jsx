"use client";

import { useEffect, useState } from "react";
import { DELIVERY_DAYS, deliveryByText } from "@/lib/delivery/estimate";

// Shows "Delivered by Sat, 18 Oct" counted from today. Rendered after mount
// so the server and browser never disagree about the date.
export default function DeliveryEstimate({ className = "" }) {
  const [text, setText] = useState("");
  useEffect(() => setText(deliveryByText()), []);
  return (
    <p className={`text-sm ${className}`}>
      <span className="text-[var(--color-text-muted)]">
        Delivery within {DELIVERY_DAYS} days
      </span>
      {text ? (
        <>
          {" · "}
          <span className="font-medium text-[var(--color-gold-bright)]">
            Get it by {text}
          </span>
        </>
      ) : null}
    </p>
  );
}
