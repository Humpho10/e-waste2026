// ── Bootstrap Icons wrapper set ─────────────────────────────────
// These used to be hand-rolled inline SVGs. They now render Bootstrap Icons
// (the webfont linked via CDN in index.html) so the ENTIRE app shares one
// icon system — matching the manager / Product-Manager pages. The call
// signature is unchanged (`<Recycle width={18} className="text-blue-500" />`
// or `<Star size={14} />`), so no consuming page needed to change how it
// uses these — only the glyphs they resolve to.
//
// Font icons inherit `color`, so existing Tailwind `text-*` / `dark:` classes
// keep working; `width`/`height`/`size` map to a font-size.
function makeIcon(biName) {
  const Icon = ({ width, height, size, className = '', style, ...rest }) => {
    const px = size ?? width ?? height;
    return (
      <i
        className={`bi bi-${biName} ${className}`.trim()}
        style={{
          ...(px != null ? { fontSize: typeof px === 'number' ? `${px}px` : px } : null),
          lineHeight: 1,
          display: 'inline-block',
          verticalAlign: '-0.125em',
          ...style,
        }}
        {...rest}
      />
    );
  };
  Icon.displayName = `Icon(${biName})`;
  return Icon;
}

// ── Core UI icons ───────────────────────────────────────────────
export const Recycle      = makeIcon('recycle');
export const Search       = makeIcon('search');
export const Menu         = makeIcon('list');
export const X            = makeIcon('x-lg');
export const ChevronRight = makeIcon('chevron-right');
export const ChevronDown  = makeIcon('chevron-down');
export const ArrowRight   = makeIcon('arrow-right');
export const ArrowLeft    = makeIcon('arrow-left');
export const Plus         = makeIcon('plus-lg');
export const Eye          = makeIcon('eye');
export const EyeOff       = makeIcon('eye-slash');
export const MapPin       = makeIcon('geo-alt');
export const Star         = makeIcon('star-fill');
export const Shield       = makeIcon('shield-check');
export const Tag          = makeIcon('tag');
export const Chat         = makeIcon('chat');
export const User         = makeIcon('person');
export const Users        = makeIcon('people');
export const CheckCircle  = makeIcon('check-circle');
export const List         = makeIcon('list-ul');

// ── Category / product icons ───────────────────────────────────
export const Cpu          = makeIcon('cpu');
export const Monitor      = makeIcon('display');
export const Server       = makeIcon('hdd-stack');
export const Plug         = makeIcon('plug');
export const Phone        = makeIcon('phone');
export const Network      = makeIcon('diagram-3');
export const Printer      = makeIcon('printer');
export const Headphones   = makeIcon('headphones');
export const Package      = makeIcon('box-seam');
export const Camera       = makeIcon('camera');
export const Mail         = makeIcon('envelope');
export const Send         = makeIcon('send');
export const Clock        = makeIcon('clock');
export const ArrowUp      = makeIcon('arrow-up');
export const Target       = makeIcon('bullseye');

// The Google mark is intentionally kept as its full-colour brand SVG — the
// monochrome Bootstrap glyph would misrepresent the logo on the sign-in
// button. Everything else in the app is a Bootstrap glyph.
export const Google = (p) => (
  <svg width={p?.width ?? 18} height={p?.height ?? 18} viewBox="0 0 24 24" className={p?.className}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
  </svg>
);

// ── Admin dashboard icon set ────────────────────────────────────
export const Grid          = makeIcon('grid');
export const UserCheck     = makeIcon('person-check');
export const Briefcase     = makeIcon('briefcase');
export const Key           = makeIcon('key');
export const FileText      = makeIcon('file-text');
export const Settings      = makeIcon('gear');
export const UserIcon      = makeIcon('person');
export const MessageSquare = makeIcon('chat-left-text');
export const Bell          = makeIcon('bell');
export const Home          = makeIcon('house');
export const LogOut        = makeIcon('box-arrow-right');
export const ChevronLeft   = makeIcon('chevron-left');
export const TrendingUp    = makeIcon('graph-up-arrow');
export const TrendingDown  = makeIcon('graph-down-arrow');
export const Activity      = makeIcon('activity');
export const XCircle       = makeIcon('x-circle');
export const PlusCircle    = makeIcon('plus-circle');
export const Zap           = makeIcon('lightning-charge-fill');
export const BarChart2     = makeIcon('bar-chart');
export const PieChart      = makeIcon('pie-chart');
export const Filter        = makeIcon('funnel');
export const Download      = makeIcon('download');

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
