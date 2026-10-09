"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HomeIcon, GridIcon, BagIcon, MenuIcon } from "@/components/ui/icons";

function Item({ href, label, icon: Icon, active, onClick, badge }) {
  const className = [
    "om-tap flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[10px] relative",
    active ? "text-[var(--color-gold-bright)]" : "text-[var(--color-text-muted)]",
  ].join(" ");

  const content = (
    <>
      <span className="relative">
        <Icon size={22} />
        {badge ? (
          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-gold)] text-[var(--color-gold-contrast)] text-[9px] font-semibold flex items-center justify-center">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
      {active && (
        <span className="absolute bottom-0 h-[2px] w-8 rounded-full bg-[var(--color-gold)]" />
      )}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** Mobile bottom navigation — matches the reference's 5-slot bar with the
 *  logo as the raised centre button. Hidden on desktop. */
export default function BottomNav({ cartCount = 0, onMenu }) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur">
      <div className="grid grid-cols-5 items-end max-w-md mx-auto">
        <Item href="/" label="Home" icon={HomeIcon} active={pathname === "/"} />
        <Item href="/shop" label="Shop" icon={GridIcon} active={pathname === "/shop"} />

        <Link
          href="/shop?cat=SHIRTS"
          aria-label="Start customizing"
          className="om-tap flex justify-center"
        >
          <span className="-mt-5 mb-1 h-14 w-14 rounded-full border border-[var(--color-gold)]/60 bg-[var(--color-surface)] shadow-[var(--shadow-pop)] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-8 w-auto" draggable={false} />
          </span>
        </Link>

        <Item
          href="/cart"
          label="Bag"
          icon={BagIcon}
          active={pathname === "/cart"}
          badge={cartCount > 0 ? cartCount : null}
        />
        <Item label="Menu" icon={MenuIcon} onClick={onMenu} />
      </div>
    </nav>
  );
}
