// ── Bootstrap Icons wrapper set ──────────────────────────────
// Bootstrap Icons ship as a webfont + CSS (linked via CDN in index.html),
// used through `<i className="bi bi-name">` rather than as SVG React
// components. These wrappers give each icon the same call signature the
// manager pages already use from react-icons (`<Icon width={18} className="..." />`),
// so this is a drop-in replacement — only the import source changes.
function makeIcon(biName) {
  const Icon = ({ width, height, size, className = '', style, ...rest }) => {
    const px = size ?? width ?? height ?? 16;
    return (
      <i
        className={`bi bi-${biName} ${className}`}
        style={{ fontSize: px, lineHeight: 1, display: 'inline-block', ...style }}
        {...rest}
      />
    );
  };
  Icon.displayName = `BiIcon(${biName})`;
  return Icon;
}

export const BiGrid          = makeIcon('grid');
export const BiBriefcase     = makeIcon('briefcase');
export const BiFolder        = makeIcon('folder');
export const BiBox           = makeIcon('box');
export const BiUsers         = makeIcon('people');
export const BiUser          = makeIcon('person');
export const BiMessageSquare = makeIcon('chat-left-text');
export const BiBell          = makeIcon('bell');
export const BiHome          = makeIcon('house');
export const BiLogOut        = makeIcon('box-arrow-right');
export const BiChevronLeft   = makeIcon('chevron-left');
export const BiChevronRight  = makeIcon('chevron-right');
export const BiSearch        = makeIcon('search');
export const BiUserCheck     = makeIcon('person-check');
export const BiUserX         = makeIcon('person-x');
export const BiMail          = makeIcon('envelope');
export const BiPhone         = makeIcon('telephone');
export const BiMapPin        = makeIcon('geo-alt');
export const BiLayers        = makeIcon('layers');
export const BiPlus          = makeIcon('plus-lg');
export const BiEdit          = makeIcon('pencil');
export const BiEdit2         = makeIcon('pencil-square');
export const BiTrash         = makeIcon('trash');
export const BiTrash2        = makeIcon('trash3');
export const BiX             = makeIcon('x-lg');
export const BiAlertCircle   = makeIcon('exclamation-circle');
export const BiCpu           = makeIcon('cpu');
export const BiSmartphone    = makeIcon('phone');
export const BiWifi          = makeIcon('wifi');
export const BiPrinter       = makeIcon('printer');
export const BiZap           = makeIcon('lightning-charge');
export const BiSend          = makeIcon('send');
export const BiCheckCircle   = makeIcon('check-circle');
export const BiXCircle       = makeIcon('x-circle');
export const BiUserPlus      = makeIcon('person-plus');
export const BiPackage       = makeIcon('box-seam');
export const BiCheck         = makeIcon('check-lg');
export const BiCheckSquare   = makeIcon('check-square');
export const BiEye           = makeIcon('eye');
export const BiInbox         = makeIcon('inbox');
export const BiImage         = makeIcon('image');
export const BiClock         = makeIcon('clock');
export const BiFolderPlus    = makeIcon('folder-plus');
export const BiList          = makeIcon('list-ul');
export const BiSunrise       = makeIcon('sunrise');
export const BiSun           = makeIcon('sun');
export const BiMoon          = makeIcon('moon-stars');
