"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import OrderSpec from "@/components/admin/OrderSpec";
import { useAdminFetch, inr, fmtDate, mmToCm } from "@/lib/admin/useAdminFetch";

const STAGES = [
  { code: "NEW", label: "New" },
  { code: "STITCHING", label: "Stitching" },
  { code: "SHIPPED", label: "Shipped" },
  { code: "DELIVERED", label: "Delivered" },
];
const input =
  "w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]";
const card = "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5";

export default function OrdersAdmin() {
  const router = useRouter();
  const { user, loading: authLoading, call, signOut } = useAdminFetch();
  const [tab, setTab] = useState("orders"); // orders | remakes
  const [forbidden, setForbidden] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/admin/orders");
  }, [authLoading, user, router]);

  if (authLoading || !user) return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["orders", "remakes"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm ${
                tab === t
                  ? "bg-[var(--color-gold)] text-[var(--color-gold-contrast)]"
                  : "border border-[var(--color-border-strong)] text-[var(--color-text-muted)]"
              }`}
            >
              {t === "orders" ? "Orders" : "Remakes"}
            </button>
          ))}
        </div>
        <button onClick={signOut} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold-bright)]">
          Sign out ({user.email})
        </button>
      </div>

      {forbidden ? (
        <p className="text-sm text-[var(--color-danger)]">{forbidden}</p>
      ) : tab === "orders" ? (
        <OrdersTab call={call} onForbidden={setForbidden} />
      ) : (
        <RemakesTab call={call} onForbidden={setForbidden} />
      )}
    </div>
  );
}

function handleErr(err, onForbidden, setError) {
  if (err.status === 401 || err.status === 403) onForbidden(err.message);
  else setError(err.message);
}

/* ------------------------------ ORDERS ------------------------------ */

function OrdersTab({ call, onForbidden }) {
  const [stage, setStage] = useState("NEW");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await call(`/api/admin/orders?stage=${stage}&q=${encodeURIComponent(q)}`));
    } catch (err) {
      handleErr(err, onForbidden, setError);
    }
  }, [call, stage, q, onForbidden]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[...STAGES, { code: "ALL", label: "All" }].map((s) => (
          <button
            key={s.code}
            onClick={() => setStage(s.code)}
            className={`rounded-full px-4 py-1.5 text-xs ${
              stage === s.code
                ? "bg-[var(--color-surface-3)] text-[var(--color-gold-bright)] border border-[var(--color-gold)]"
                : "border border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
          >
            {s.label}
            {data?.counts && s.code !== "ALL" ? ` (${data.counts[s.code] ?? 0})` : ""}
          </button>
        ))}
        {data?.openRemakes ? (
          <span className="ml-auto self-center text-xs text-[var(--color-gold-bright)]">
            {data.openRemakes} open remake{data.openRemakes === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <input className={`${input} mb-4`} placeholder="Search order number, email or product" value={q} onChange={(e) => setQ(e.target.value)} />

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-[var(--color-text-muted)]">Loading…</p> : null}
      {data && !data.orders.length ? <p className="text-sm text-[var(--color-text-muted)]">No orders here.</p> : null}

      <div className="flex flex-col gap-3">
        {(data?.orders ?? []).map((o) => (
          <div key={o.id} className={card}>
            <button className="w-full text-left" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {o.name ?? "Order"} <span className="text-sm text-[var(--color-text-muted)]">· {o.email}</span>
                </p>
                <span className="rounded-full bg-[var(--color-surface-3)] px-3 py-1 text-xs text-[var(--color-gold-bright)]">
                  {STAGES.find((s) => s.code === o.stage)?.label ?? o.stage}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {o.lines.map((l) => `${l.name} × ${l.quantity}${l.custom ? " (my size)" : ""}`).join(", ")}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-faint)]">
                Paid {fmtDate(o.paid_at)} · {inr(o.total_inr)}
                {o.tracking_number ? ` · ${o.courier ?? ""} ${o.tracking_number}` : ""}
              </p>
            </button>
            {openId === o.id ? <OrderDetail id={o.id} call={call} onChanged={load} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetail({ id, call, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await call(`/api/admin/orders/${id}`);
      setD(res);
      setCourier(res.order.courier ?? "");
      setTracking(res.order.tracking_number ?? "");
      setNotes(res.order.admin_notes ?? "");
    } catch (err) {
      setError(err.message);
    }
  }, [call, id]);
  useEffect(() => { load(); }, [load]);

  async function save(extra = {}) {
    setBusy(true);
    setError("");
    try {
      await call(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ courier, trackingNumber: tracking, adminNotes: notes, ...extra }),
      });
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!d) return <p className="mt-4 text-sm text-[var(--color-text-muted)]">{error || "Loading…"}</p>;
  const { order, lines, contact, remakes } = d;
  const stageIdx = STAGES.findIndex((s) => s.code === order.stage);
  const addr = contact?.shippingAddress;

  return (
    <div className="mt-5 flex flex-col gap-5 border-t border-[var(--color-border)] pt-5">
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/orders/${id}/print`} target="_blank" className="text-sm text-[var(--color-gold-bright)]">
          Print tailor sheet ↗
        </Link>
        {order.shopify_admin_url ? (
          <a href={order.shopify_admin_url} target="_blank" rel="noreferrer" className="text-sm text-[var(--color-gold-bright)]">
            Open in Shopify ↗
          </a>
        ) : null}
      </div>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--color-gold)]">Customer and address</h3>
        {contact ? (
          <div className="text-sm leading-relaxed">
            <p>{addr?.name ?? contact.customer?.displayName ?? "-"}</p>
            <p className="text-[var(--color-text-muted)]">{contact.email ?? order.email} · {addr?.phone ?? contact.phone ?? contact.customer?.phone ?? "no phone"}</p>
            {addr ? (
              <p className="mt-1">
                {[addr.address1, addr.address2, addr.city, addr.province, addr.zip, addr.country].filter(Boolean).join(", ")}
              </p>
            ) : <p className="mt-1 text-[var(--color-text-muted)]">No delivery address on the order.</p>}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            {order.email}. Address could not be read from Shopify here - open the order in Shopify to see it.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--color-gold)]">Garments</h3>
        <div className="flex flex-col gap-3">{lines.map((l) => <OrderSpec key={l.cart_item_id} line={l} />)}</div>
      </section>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--color-gold)]">Price and GST</h3>
        <div className="text-sm leading-relaxed">
          <p>Items {inr(order.items_total_inr)} · Taxable {inr(order.taxable_inr)} · GST {inr(order.gst_inr)}
            {Object.keys(order.gst_by_rate ?? {}).length ? ` (${Object.entries(order.gst_by_rate).map(([r, v]) => `${Math.round(r * 100)}%: ${inr(v)}`).join(", ")})` : ""}</p>
          <p>Shipping {inr(order.shipping_inr)} · <strong>Total {inr(order.total_inr)}</strong></p>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--color-gold)]">Progress</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {STAGES.map((s, i) => (
            <Button
              key={s.code}
              variant={s.code === order.stage ? "primary" : "secondary"}
              className="!px-4 !py-2 !text-xs"
              disabled={busy || s.code === order.stage}
              onClick={() => save({ stage: s.code })}
            >
              {i < stageIdx ? "← " : ""}{s.label}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Courier (needed for Shipped)" value={courier} onChange={(e) => setCourier(e.target.value)} />
          <input className={input} placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        </div>
        <textarea className={`${input} mt-3`} rows={2} placeholder="Private notes (customer never sees these)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-3 flex items-center gap-4">
          <Button className="!px-5 !py-2 !text-xs" loading={busy} onClick={() => save()}>Save details</Button>
          <span className="text-xs text-[var(--color-text-faint)]">
            Delivered: {fmtDate(order.delivered_at)}{order.delivered_at ? " (15-day remake window runs from here)" : ""}
          </span>
        </div>
        {error ? <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p> : null}
      </section>

      {remakes.length ? (
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--color-gold)]">Remakes on this order</h3>
          {remakes.map((r) => (
            <p key={r.id} className="text-sm">{r.status.replace("_", " ")} · {fmtDate(r.created_at)}{r.reason ? ` · "${r.reason}"` : ""} (handle in the Remakes tab)</p>
          ))}
        </section>
      ) : null}
    </div>
  );
}

/* ------------------------------ REMAKES ------------------------------ */

function RemakesTab({ call, onForbidden }) {
  const [filter, setFilter] = useState("OPEN");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await call(`/api/admin/remakes?status=${filter}`));
    } catch (err) {
      handleErr(err, onForbidden, setError);
    }
  }, [call, filter, onForbidden]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["OPEN", "REQUESTED", "APPROVED", "IN_STITCHING", "SHIPPED", "REJECTED", "ALL"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs ${
              filter === s
                ? "bg-[var(--color-surface-3)] text-[var(--color-gold-bright)] border border-[var(--color-gold)]"
                : "border border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
          >
            {s === "OPEN" ? "Open" : s.replace("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-[var(--color-text-muted)]">Loading…</p> : null}
      {data && !data.remakes.length ? <p className="text-sm text-[var(--color-text-muted)]">No remake requests here.</p> : null}
      <div className="flex flex-col gap-4">
        {(data?.remakes ?? []).map((r) => <RemakeCard key={r.id} r={r} call={call} onChanged={load} />)}
      </div>
    </div>
  );
}

function RemakeCard({ r, call, onChanged }) {
  const [note, setNote] = useState(r.admin_note ?? "");
  const [courier, setCourier] = useState(r.courier ?? "");
  const [tracking, setTracking] = useState(r.tracking_number ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function set(status) {
    setBusy(true);
    setError("");
    try {
      await call(`/api/admin/remakes/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, note, courier, trackingNumber: tracking }),
      });
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const codes = Object.keys(r.original_values ?? {});
  const next = {
    REQUESTED: [["APPROVED", "Approve"], ["REJECTED", "Reject"]],
    APPROVED: [["IN_STITCHING", "Start stitching"], ["REJECTED", "Reject"]],
    IN_STITCHING: [["SHIPPED", "Mark shipped"]],
    SHIPPED: [],
    REJECTED: [["REQUESTED", "Reopen"]],
  }[r.status] ?? [];

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {r.order_name ?? "Order"} · {r.product_name ?? "Item"}
          <span className="text-sm text-[var(--color-text-muted)]"> · {r.email}</span>
        </p>
        <span className="rounded-full bg-[var(--color-surface-3)] px-3 py-1 text-xs text-[var(--color-gold-bright)]">
          {r.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-faint)]">Requested {fmtDate(r.created_at)}</p>
      {r.reason ? <p className="mt-2 text-sm">Customer note: "{r.reason}"</p> : null}

      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--color-text-muted)]">
            <th className="py-1 font-normal">Measurement</th><th className="font-normal">Original</th><th className="font-normal">New</th><th className="font-normal">Change</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => {
            const o = r.original_values[c];
            const n = Math.round(Number(r.new_values?.[c]));
            const diff = n - o;
            return (
              <tr key={c} className="border-t border-[var(--color-border)]">
                <td className="py-1">{r.measurement_names?.[c] ?? c}</td>
                <td>{mmToCm(o)}</td>
                <td>{mmToCm(n)}</td>
                <td className={diff ? "text-[var(--color-gold-bright)]" : "text-[var(--color-text-faint)]"}>
                  {diff ? `${diff > 0 ? "+" : ""}${diff} mm` : "same"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <textarea className={`${input} mt-3`} rows={2} placeholder="Note to the customer (required when rejecting - they can see it)" value={note} onChange={(e) => setNote(e.target.value)} />
      {["IN_STITCHING", "SHIPPED"].includes(r.status) ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Courier (needed for Shipped)" value={courier} onChange={(e) => setCourier(e.target.value)} />
          <input className={input} placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {next.map(([status, label]) => (
          <Button key={status} variant={status === "REJECTED" ? "secondary" : "primary"} className="!px-4 !py-2 !text-xs" disabled={busy} onClick={() => set(status)}>
            {label}
          </Button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
