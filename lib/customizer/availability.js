/**
 * Style-aware option availability.
 *
 * Some garments (the kurti) have a different picture for every neck / sleeve
 * PER STYLE. Those assets are tagged in the database with "@<STYLE_VALUE>"
 * at the end of their asset_code, e.g. "KURTI_NECK_ROUND@KURTI_A_LINE".
 *
 *  - A tagged asset is only drawn while that style is selected.
 *  - An option value whose pictures are all tagged is only offered for the
 *    styles that actually have a picture for it (so Kaftan, which has no
 *    sleeve pictures, simply has no Sleeve section).
 *  - Values/groups without tagged assets (shirts, pants, Yes/No options ...)
 *    are always available - nothing changes for them.
 */

export const STYLE_GROUP = "STYLE";

export function assetStyleTag(assetCode) {
  const code = String(assetCode ?? "");
  const i = code.indexOf("@");
  return i < 0 ? null : code.slice(i + 1);
}

export function isValueAvailable(manifest, groupCode, valueCode, selection) {
  const codes = manifest?.valueAssets?.[`${groupCode}:${valueCode}`];
  if (!codes || codes.length === 0) return true;
  const tags = codes.map(assetStyleTag).filter(Boolean);
  if (tags.length === 0) return true;
  const style = selection?.[STYLE_GROUP];
  return style ? tags.includes(style) : true;
}

function hasTaggedPicture(manifest, groupCode, valueCode) {
  const codes = manifest?.valueAssets?.[`${groupCode}:${valueCode}`];
  return Boolean(codes && codes.some((c) => assetStyleTag(c)));
}

/**
 * The values of a group that can be offered for the selected style.
 * In a group whose pictures are per style, a value with no picture of its own
 * (e.g. a hidden "built-in neck" placeholder) is never listed.
 */
export function availableValues(manifest, groupCode, groupOptions, selection) {
  const perStyle = groupOptions.some((o) =>
    hasTaggedPicture(manifest, groupCode, o.option_value_code)
  );
  const avail = groupOptions.filter((o) =>
    isValueAvailable(manifest, groupCode, o.option_value_code, selection)
  );
  return perStyle
    ? avail.filter((o) => hasTaggedPicture(manifest, groupCode, o.option_value_code))
    : avail;
}

/**
 * After the style (or anything else) changes, returns the selections that
 * must change so every group points at something that exists for the style.
 * A group with nothing available (Kaftan sleeves, Angrakha necks) is set to its
 * "No ..." / "None" value so it adds no cost.
 */
export function repairSelection(manifest, options, selection) {
  const changes = {};
  for (const [groupCode, groupOptions] of Object.entries(options ?? {})) {
    if (groupCode === STYLE_GROUP) continue;
    const current = selection?.[groupCode];
    const avail = availableValues(manifest, groupCode, groupOptions, selection);
    if (avail.length === 0) {
      const none = groupOptions.find((o) =>
        /(^|_)NO(_|$)|(^|_)NONE(_|$)/.test(o.option_value_code)
      );
      if (none && none.option_value_code !== current) {
        changes[groupCode] = none.option_value_code;
      }
      continue;
    }
    if (avail.some((o) => o.option_value_code === current)) continue;
    const preferred = avail.find((o) => o.is_default) ?? avail[0];
    changes[groupCode] = preferred.option_value_code;
  }
  return changes;
}

export function manifestGroupName(manifest, groupCode) {
  return manifest?.groups?.find((g) => g.code === groupCode)?.name ?? null;
}

export function manifestValueName(manifest, groupCode, valueCode) {
  return (
    manifest?.values?.find(
      (v) => v.group_code === groupCode && v.value_code === valueCode
    )?.value_name ?? null
  );
}
