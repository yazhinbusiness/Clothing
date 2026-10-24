"use client";

import { inr, mmToCm } from "@/lib/admin/useAdminFetch";

/** One ordered garment, written the way a tailor needs it. Shared by the admin screen and the print sheet. */
export default function OrderSpec({ line, showMoney = true }) {
  const custom = line.measurement_mode === "CUSTOM";
  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">
          {line.product_name} <span className="text-[var(--color-text-muted)]">× {line.quantity}</span>
        </p>
        {showMoney ? <p className="text-sm">{inr(line.line_total)}</p> : null}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <Row k="Material" v={line.material_code} />
        <Row k="Colour" v={line.color_code} />
        {!custom ? <Row k="Size" v={line.size_code} /> : null}
        {(line.options ?? []).map((o) => (
          <Row key={o.groupCode} k={o.groupName ?? o.groupCode} v={o.valueName ?? o.valueCode} />
        ))}
      </dl>

      {custom ? (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wider text-[var(--color-gold)]">Made to measure</p>
          <dl className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {(line.measurements ?? []).map((m) => (
              <Row key={m.code} k={m.name} v={mmToCm(m.measurementMm)} />
            ))}
          </dl>
        </div>
      ) : null}

      {showMoney && line.cost_inr != null ? (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Cost {inr(line.cost_inr)} · Profit {inr(line.profit_inr)} · GST {line.gst_rate != null ? `${Math.round(line.gst_rate * 100)}%` : "-"} ({inr(line.gst_inr)})
        </p>
      ) : null}
    </div>
  );
}

function Row({ k, v }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="flex gap-2">
      <dt className="text-[var(--color-text-muted)]">{k}:</dt>
      <dd>{String(v)}</dd>
    </div>
  );
}
