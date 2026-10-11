/** Trust message shown wherever a customer chooses or pays for My size. */
export default function RemakePromise({ compact = false }) {
  return (
    <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-relaxed">
      <p className="font-medium text-[var(--color-gold-bright)]">
        Free remake on your first My size order
      </p>
      {!compact && (
        <p className="mt-1 text-[var(--color-text-muted)]">
          If the stitching or fit isn&apos;t right, we&apos;ll remake it free. Ask within
          15 days of delivery; we collect the original. Made-to-measure
          garments have no refunds or returns.
        </p>
      )}
    </div>
  );
}
