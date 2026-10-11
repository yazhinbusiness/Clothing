/**
 * Finds the real option_value_code for a listing tag value, tolerating
 * naming differences (tag "Full" -> code FULL_SLEEVE, "Notched" ->
 * NOTCHED_COLLAR, "3/4" -> THREE_QUARTER ...). Returns null if nothing fits.
 */
export function resolveOptionCode(groupOptions, wanted) {
  if (!wanted || !groupOptions?.length) return null;
  const norm = (v) =>
    String(v).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const codes = groupOptions.map((o) => o.option_value_code);
  // Listing wording -> the code your option_value_master actually uses
  // (FIT group is REGULAR / FIT / LOOSE, so "Slim" means FIT).
  const ALIASES = { SLIM: "FIT", FITTED: "FIT", RELAXED: "LOOSE" };
  const w0 = norm(wanted).replace(/^3_4$/, "THREE_QUARTER");
  const w = codes.some((c) => norm(c) === ALIASES[w0]) ? ALIASES[w0] : w0;
  const stem = w.replace(/ED$/, "");
  return (
    codes.find((c) => norm(c) === w) ??
    codes.find((c) => norm(c).startsWith(`${w}_`)) ??
    codes.find((c) => norm(c) === stem || norm(c).startsWith(`${stem}_`)) ??
    codes.find((c) => norm(c).includes(w)) ??
    null
  );
}

