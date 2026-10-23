"use client";

import { ChevronDownIcon } from "@/components/ui/icons";

/**
 * One expandable group in the Customize panel (Style, Neck, Sleeve ...).
 * Sections open and close independently; the closed header shows the current
 * choice so the whole panel stays scannable.
 */
export default function CustomizeSection({
  title,
  summary,
  open,
  onToggle,
  children,
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="om-tap w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-2)]/60 transition-colors"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium">{title}</span>
          {summary ? (
            <span className="block text-xs text-[var(--color-text-muted)] truncate">
              {summary}
            </span>
          ) : null}
        </span>
        <span
          className={[
            "shrink-0 text-[var(--color-text-muted)] transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          <ChevronDownIcon size={18} />
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
