import Link from "next/link";

import {
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
} from "@/components/ui/icons";

const LINKS = ["About Us", "Help", "Shipping", "Returns", "Terms", "Privacy"];

export default function Footer({ extraBottomPadding = false }) {
  return (
    <footer
      className={[
        "mt-14 border-t border-[var(--color-border)] bg-[var(--color-bg)]",
        extraBottomPadding ? "pb-28 lg:pb-0" : "",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-7 w-auto" draggable={false} />
            <span className="font-[var(--font-display)] text-lg tracking-[0.14em] uppercase">
              Oh Must
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[11px] text-[var(--color-text-faint)] pr-3 border-r border-[var(--color-border-strong)]">
              Precision is personal
            </span>
            {[InstagramIcon, FacebookIcon, YoutubeIcon].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-gold-bright)]"
              >
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[var(--color-text-muted)]">
          {LINKS.map((label) => (
            <a key={label} href="#" className="hover:text-[var(--color-gold-bright)]">
              {label}
            </a>
          ))}
        </nav>

        <p className="mt-6 text-center text-[11px] text-[var(--color-text-faint)]">
          © {new Date().getFullYear()} OH MUST. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
