"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import OrderSpec from "@/components/admin/OrderSpec";
import { useAdminFetch, fmtDate } from "@/lib/admin/useAdminFetch";

/** One-page tailor sheet: the garment spec and measurements, no prices. Use the Print button (or Ctrl+P). */
export default function PrintSheet({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading, call } = useAdminFetch();
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=/admin/orders/${id}/print`);
      return;
    }
    call(`/api/admin/orders/${id}`).then(setD).catch((e) => setError(e.message));
  }, [loading, user, id, call, router]);

  if (error) return <p className="p-6 text-sm">{error}</p>;
  if (!d) return <p className="p-6 text-sm">Loading…</p>;
  const { order, lines, contact } = d;
  const addr = contact?.shippingAddress;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black" style={{ minHeight: "100vh", colorScheme: "light" }}>
      <style>{`
        @media print { .no-print { display: none !important; } body { background: white !important; } }
        .tailor-sheet * { color: black !important; border-color: #bbb !important; background: transparent !important; }
      `}</style>
      <div className="tailor-sheet">
        <div className="no-print mb-4">
          <button onClick={() => window.print()} className="rounded border px-4 py-2 text-sm">Print</button>
        </div>
        <h1 className="text-2xl font-semibold">Tailor sheet · {order.name}</h1>
        <p className="mt-1 text-sm">Paid {fmtDate(order.paid_at)} · Stage {order.stage}</p>
        {addr ? (
          <p className="mt-2 text-sm">
            Ship to: {addr.name}, {[addr.address1, addr.address2, addr.city, addr.province, addr.zip].filter(Boolean).join(", ")}
            {addr.phone ? ` · ${addr.phone}` : ""}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-4">
          {lines.map((l) => <OrderSpec key={l.cart_item_id} line={l} showMoney={false} />)}
        </div>
        {order.admin_notes ? <p className="mt-6 text-sm">Notes: {order.admin_notes}</p> : null}
      </div>
    </div>
  );
}
