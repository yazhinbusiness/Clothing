export function getGuestCartId() {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = "guest_cart_id";

  let guestCartId = localStorage.getItem(storageKey);

  if (!guestCartId) {
    guestCartId = crypto.randomUUID();
    localStorage.setItem(storageKey, guestCartId);
  }

  return guestCartId;
}