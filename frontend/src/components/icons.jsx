// ── Lightweight inline SVG icon set ─────────────────────────────
// Dependency-free. Every icon inherits `currentColor` and accepts a
// className so it can be sized/colored with Tailwind utilities.

const base = ({ size, width, height, ...rest } = {}) => ({
  width: width ?? size ?? 20,
  height: height ?? size ?? 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...rest,
});

export const Recycle = (p) => (
  <svg {...base(p)}><path d="M7 19H4.8a2 2 0 0 1-1.7-3l1.5-2.5" /><path d="m14 16-3 3 3 3" /><path d="M8.3 9 5 14l1.5 1" /><path d="M11 3.4 9.5 6 12 7" /><path d="m14.5 6-1.6-2.7a2 2 0 0 0-3.4 0L8 5" /><path d="M19.7 14 18 17l-3-1" /><path d="M22 12.3 20.5 9 18 10" /></svg>
);

export const Search = (p) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);

export const Menu = (p) => (
  <svg {...base(p)}><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
);

export const X = (p) => (
  <svg {...base(p)}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

export const ChevronRight = (p) => (
  <svg {...base(p)}><polyline points="9 18 15 12 9 6" /></svg>
);

export const ChevronDown = (p) => (
  <svg {...base(p)}><polyline points="6 9 12 15 18 9" /></svg>
);

export const ArrowRight = (p) => (
  <svg {...base(p)}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);

export const ArrowLeft = (p) => (
  <svg {...base(p)}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);

export const Plus = (p) => (
  <svg {...base(p)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

export const Eye = (p) => (
  <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);

export const EyeOff = (p) => (
  <svg {...base(p)}><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2" /><path d="M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.4-.9" /><path d="m9.5 9.5a3 3 0 0 0 4.2 4.2" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
);

export const MapPin = (p) => (
  <svg {...base(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

export const Star = (p) => (
  <svg {...base({ ...p, fill: p?.fill ?? 'currentColor', stroke: p?.stroke ?? 'none' })}><polygon points="12 2 15.1 8.6 22 9.3 16.5 14.2 18 21 12 17.6 6 21 7.5 14.2 2 9.3 8.9 8.6 12 2" /></svg>
);

export const Shield = (p) => (
  <svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
);

export const Tag = (p) => (
  <svg {...base(p)}><path d="M12.6 2.6a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-6.8 6.8a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 2 11.8V5a2 2 0 0 1 2-2Z" /><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" /></svg>
);

export const Chat = (p) => (
  <svg {...base(p)}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4A8.4 8.4 0 0 1 21 11.5Z" /></svg>
);

export const User = (p) => (
  <svg {...base(p)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export const Users = (p) => (
  <svg {...base(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></svg>
);

export const CheckCircle = (p) => (
  <svg {...base(p)}><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" /><path d="m22 4-10 10-3-3" /></svg>
);

export const List = (p) => (
  <svg {...base(p)}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
);

// ── Category / product icons ───────────────────────────────────
export const Cpu = (p) => (
  <svg {...base(p)}><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /><rect x="9.5" y="9.5" width="5" height="5" rx="0.5" /></svg>
);

export const Monitor = (p) => (
  <svg {...base(p)}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
);

export const Server = (p) => (
  <svg {...base(p)}><rect x="2" y="3" width="20" height="8" rx="2" /><rect x="2" y="13" width="20" height="8" rx="2" /><line x1="6" y1="7" x2="6.01" y2="7" /><line x1="6" y1="17" x2="6.01" y2="17" /></svg>
);

export const Plug = (p) => (
  <svg {...base(p)}><path d="M12 22v-5" /><path d="M9 8V2M15 8V2" /><path d="M18 8a6 6 0 0 1-12 0Z" /></svg>
);

export const Phone = (p) => (
  <svg {...base(p)}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
);

export const Network = (p) => (
  <svg {...base(p)}><rect x="9" y="2" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" /><path d="M12 8v4M12 12H5v4M12 12h7v4" /></svg>
);

export const Printer = (p) => (
  <svg {...base(p)}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
);

export const Headphones = (p) => (
  <svg {...base(p)}><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" /><path d="M3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2Z" /></svg>
);

export const Package = (p) => (
  <svg {...base(p)}><path d="m7.5 4.3 9 5.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><polyline points="3.3 7 12 12 20.7 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
);

export const Camera = (p) => (
  <svg {...base(p)}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="4" /></svg>
);

export const Mail = (p) => (
  <svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
);

export const Send = (p) => (
  <svg {...base(p)}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);

export const Clock = (p) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export const ArrowUp = (p) => (
  <svg {...base(p)}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
);

export const Target = (p) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);

export const Google = (p) => (
  <svg width={p?.width ?? 18} height={p?.height ?? 18} viewBox="0 0 24 24" className={p?.className}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
  </svg>
);

// ── Admin dashboard icon set (dependency-free, matches the rest) ──
export const Grid = (p) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
);

export const UserCheck = (p) => (
  <svg {...base(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
);

export const Briefcase = (p) => (
  <svg {...base(p)}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

export const Key = (p) => (
  <svg {...base(p)}><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6M15.5 7.5 18 5M17 9l2 2" /></svg>
);

export const FileText = (p) => (
  <svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /><line x1="8" y1="9" x2="10" y2="9" /></svg>
);

export const Settings = (p) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
);

export const UserIcon = (p) => (
  <svg {...base(p)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export const MessageSquare = (p) => (
  <svg {...base(p)}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4A8.4 8.4 0 0 1 21 11.5Z" /></svg>
);

export const Bell = (p) => (
  <svg {...base(p)}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);

export const Home = (p) => (
  <svg {...base(p)}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);

export const LogOut = (p) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);

export const ChevronLeft = (p) => (
  <svg {...base(p)}><polyline points="15 18 9 12 15 6" /></svg>
);

export const TrendingUp = (p) => (
  <svg {...base(p)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);

export const TrendingDown = (p) => (
  <svg {...base(p)}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
);

export const Activity = (p) => (
  <svg {...base(p)}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);

export const XCircle = (p) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);

export const PlusCircle = (p) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);

export const Zap = (p) => (
  <svg {...base({ ...p, fill: p?.fill ?? 'currentColor', stroke: p?.stroke ?? 'none' })}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);

export const BarChart2 = (p) => (
  <svg {...base(p)}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);

export const PieChart = (p) => (
  <svg {...base(p)}><path d="M21.2 15a9 9 0 1 1-9.2-13" /><path d="M22 12A10 10 0 0 0 12 2v10Z" /></svg>
);

export const Filter = (p) => (
  <svg {...base(p)}><polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" /></svg>
);

export const Download = (p) => (
  <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

// Pick a category icon by fuzzy-matching the category name.
export function categoryIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('computer') || n.includes('component')) return Cpu;
  if (n.includes('mobile') || n.includes('phone'))       return Phone;
  if (n.includes('network'))                             return Network;
  if (n.includes('office') || n.includes('print'))       return Printer;
  if (n.includes('entertain') || n.includes('audio'))    return Headphones;
  if (n.includes('screen') || n.includes('monitor') || n.includes('display')) return Monitor;
  if (n.includes('power') || n.includes('accessor'))     return Plug;
  if (n.includes('drive') || n.includes('storage') || n.includes('hdd')) return Server;
  if (n.includes('cpu') || n.includes('processor') || n.includes('ram') || n.includes('memory')) return Cpu;
  return Package;
}