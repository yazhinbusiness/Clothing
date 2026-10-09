"use client";

import {
  FabricIcon,
  RulerIcon,
  LeafIcon,
  ShieldIcon,
  TruckIcon,
  RefreshIcon,
} from "@/components/ui/icons";

const FEATURES = [
  { icon: FabricIcon, label: "Premium Fabric" },
  { icon: RulerIcon, label: "Made To Measure" },
  { icon: LeafIcon, label: "Breathable" },
  { icon: ShieldIcon, label: "Durable" },
];

const SHIPPING = [
  { icon: TruckIcon, title: "Free Shipping", subtitle: "On orders over ₹3,000" },
  { icon: RefreshIcon, title: "Free Remake", subtitle: "Fit issue window" },
  { icon: ShieldIcon, title: "Secure Payment", subtitle: "Via Shopify checkout" },
];

export function FeatureRow() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
      {FEATURES.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] py-3 px-1"
        >
          <Icon size={18} className="text-[var(--color-gold-bright)]" />
          <span className="text-[10.5px] leading-tight text-[var(--color-text-muted)]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ShippingRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
      {SHIPPING.map(({ icon: Icon, title, subtitle }) => (
        <div key={title} className="flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-gold-bright)]">
            <Icon size={17} />
          </span>
          <div className="text-xs">
            <p className="font-medium text-[var(--color-text)]">{title}</p>
            <p className="text-[var(--color-text-faint)]">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
