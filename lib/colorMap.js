/**
 * Maps product `color_code` values (as stored in Supabase) to a
 * display hex value. Extend this map as new colors are added to
 * product_colors — unlisted codes still get a stable fallback color
 * derived from the code itself, so nothing renders blank.
 */
export const COLOR_HEX = {
  WHITE: "#f5f1ea",
  BLACK: "#141414",
  BEIGE: "#d9c4a0",
  NAVY: "#1f2a44",
  GREY: "#8b8880",
  GRAY: "#8b8880",
  ROSE_GOLD: "#c9a08a",
  CHARCOAL: "#3a3a3a",
  IVORY: "#efe8d8",
  TAN: "#c8a978",
  OLIVE: "#5f6a4c",
  // Shirt module — authoritative Cotton/Satin palette (see
  // sql/update_shirt_colors_to_spec.sql)
  LAVENDER: "#c3b8de",
  PEACH: "#f5c9a8",
  BROWN: "#6f4e37",
  MAROON: "#800000",
  AQUA: "#6fcbc4",
  GREY: "#9a9892",
  BURGUNDY: "#722f37",
  ROSE: "#b76e79",
  GOLDEN: "#c9a96b",
  MIDNIGHT: "#11132b",
};

export function getColorHex(code) {
  if (!code) return "#8b8880";
  if (COLOR_HEX[code]) return COLOR_HEX[code];

  // Deterministic fallback so an unmapped code always renders
  // the same, reasonably distinct color instead of blank.
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 24%, 55%)`;
}
