/**
 * Minimal inline icon set, sized via `size` prop.
 * Kept dependency-free so the project doesn't need an icon package.
 */

function base(props) {
  return {
    width: props.size ?? 20,
    height: props.size ?? 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: props.strokeWidth ?? 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: props.className,
  };
}

export function SearchIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function HeartIcon({ filled, ...props }) {
  return (
    <svg {...base(props)} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.5s-7.5-4.6-10-9.2C.5 8 1.8 4.5 5 3.5c2.1-.7 4.2.1 5.5 1.9l1.5 2 1.5-2c1.3-1.8 3.4-2.6 5.5-1.9 3.2 1 4.5 4.5 3 7.8-2.5 4.6-10 9.2-10 9.2z" />
    </svg>
  );
}

export function BagIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M6 8h12l1 13H5L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ShareIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="18" cy="5" r="2.4" />
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="19" r="2.4" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}

export function TruckIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}

export function RefreshIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 4v5h5" />
      <path d="M20 20v-5h-5" />
      <path d="M5.1 9A8 8 0 0 1 19 8.5M18.9 15a8 8 0 0 1-13.9.5" />
    </svg>
  );
}

export function ShieldIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function FabricIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 4l16 16M4 9l11 11M4 14l6 6" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}

export function RulerIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v3M15 8v3" />
    </svg>
  );
}

export function LeafIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" />
      <path d="M5 19c2-4 5-7 9-9" />
    </svg>
  );
}

export function SleeveIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M8 4h8v3l4 3v6h-5v-4H9v4H4v-6l4-3V4z" />
    </svg>
  );
}

export function CollarIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M6 4h5l1 3 1-3h5l3 5-4 2-1-2v10H8V9L7 11l-4-2 3-5z" />
    </svg>
  );
}

export function PocketIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="9" width="12" height="10" rx="1.5" />
      <path d="M6 12h12" />
    </svg>
  );
}

export function PlacketIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v18" />
      <circle cx="12" cy="7" r="0.8" fill="currentColor" />
      <circle cx="12" cy="11" r="0.8" fill="currentColor" />
      <circle cx="12" cy="15" r="0.8" fill="currentColor" />
      <path d="M8 3h8M8 21h8" />
    </svg>
  );
}

export function FitIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M8 3h8l1 6-2 1 .5 10h-7L8 10l-2-1 2-6z" />
    </svg>
  );
}

export function PaletteIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.2 4.2 0 0 0 21 12a9 9 0 0 0-9-9z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkleIcon(props) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M12 2l1.8 5.3L19 9l-5.2 1.7L12 16l-1.8-5.3L5 9l5.2-1.7L12 2z" />
    </svg>
  );
}

export function SlidersIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9z" />
    </svg>
  );
}

export function GridIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function InstagramIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.8" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2H8v3.5h2.5V20H14v-6.5h2.5L17 10h-3V8.5c0-.3.2-.5.5-.5z" />
    </svg>
  );
}

export function YoutubeIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="M10.5 9.5v5l4.2-2.5-4.2-2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
