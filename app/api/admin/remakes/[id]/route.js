import { requireAdmin } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/server";

const STATUSES = ["REQUESTED", "APPROVED", "IN_STITCHING", "SHIPPED", "REJECTED"];
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

/** PATCH /api/admin/remakes/:id  { status, note?, courier?, trackingNumber? } (admin only) */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = String(body.status ?? "").toUpperCase();
    if (!STATUSES.includes(status)) {
      return Response.json({ error: "Unknown status." }, { status: 400 });
    }
    const note = clean(body.note, 1000);
    if (status === "REJECTED" && !note) {
      return Response.json(
        { error: "Write a short reason - the customer will see it." },
        { status: 400 }
      );
    }
    const courier = clean(body.courier, 80);
    const tracking = clean(body.trackingNumber, 80);
    if (status === "SHIPPED" && (!courier || !tracking)) {
      return Response.json(
        { error: "Add the courier and tracking number before marking it shipped." },
        { status: 400 }
      );
    }

    const admin = serviceClient();
    const { data: existing } = await admin
      .from("remake_requests")
      .select("id, decided_at")
      .eq("id", id)
      .maybeSingle();
    if (!existing) return Response.json({ error: "Remake not found." }, { status: 404 });

    const now = new Date().toISOString();
    const patch = { status, updated_at: now };
    if (body.note !== undefined) patch.admin_note = note || null;
    if (courier) patch.courier = courier;
    if (tracking) patch.tracking_number = tracking;
    if (["APPROVED", "REJECTED"].includes(status) && !existing.decided_at) patch.decided_at = now;

    const { error } = await admin.from("remake_requests").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Admin remake update error:", err);
    return Response.json({ error: "Could not save the change." }, { status: 500 });
  }
}
