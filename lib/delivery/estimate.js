// Delivery promise: within 7 days of the order (calendar days, all week).
// Change DELIVERY_DAYS here and every screen follows.
export const DELIVERY_DAYS = 7;

const DAY = 86400000;
const fmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

/** Date `days` after `from` (default: now). */
export function deliveryDate(from = new Date(), days = DELIVERY_DAYS) {
  const start = from instanceof Date ? from : new Date(from);
  return new Date(start.getTime() + days * DAY);
}

export function formatDeliveryDate(date) {
  return fmt.format(date);
}

/** e.g. "Sat, 18 Oct" for an order placed `from` (default: today). */
export function deliveryByText(from = new Date()) {
  return formatDeliveryDate(deliveryDate(from));
}
