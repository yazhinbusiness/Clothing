import OrdersAdmin from "@/components/admin/OrdersAdmin";

export const metadata = {
  title: "Orders and Remakes — Oh Must Admin",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] px-4 sm:px-8 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-[var(--font-display)] text-3xl mb-1">Orders and Remakes</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Internal tool. Only the accounts listed in ADMIN_EMAILS can use it.
        </p>
        <OrdersAdmin />
      </div>
    </div>
  );
}
