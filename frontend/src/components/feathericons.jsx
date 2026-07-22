// ── react-icons → Bootstrap Icons shim ──────────────────────────
// The dashboard / regular-user pages and a few shared components used to
// import Feather (`react-icons/fi`) and Font Awesome (`react-icons/fa`)
// glyphs. To give the whole app a single icon system (Bootstrap Icons, the
// webfont linked in index.html — the same set the manager/PM pages use),
// those imports now point here instead of `react-icons/*`. Each export keeps
// the original name and a react-icons-compatible signature (`size`,
// `className`, `style`, `title`, `onClick`, …) so no call sites changed.
function makeIcon(biName) {
  const Icon = ({ size, width, height, className = '', style, ...rest }) => {
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

// ── Font Awesome names in use ───────────────────────────────────
export const FaRecycle      = makeIcon('recycle');
export const FaShoppingBag  = makeIcon('bag');

// ── Feather names in use ────────────────────────────────────────
export const FiActivity      = makeIcon('activity');
export const FiAlertCircle   = makeIcon('exclamation-circle');
export const FiAlertTriangle = makeIcon('exclamation-triangle');
export const FiArrowLeft     = makeIcon('arrow-left');
export const FiArrowRight    = makeIcon('arrow-right');
export const FiBarChart2     = makeIcon('bar-chart');
export const FiBell          = makeIcon('bell');
export const FiCalendar      = makeIcon('calendar');
export const FiCamera        = makeIcon('camera');
export const FiCheck         = makeIcon('check-lg');
export const FiCheckCircle   = makeIcon('check-circle');
export const FiChevronLeft   = makeIcon('chevron-left');
export const FiChevronRight  = makeIcon('chevron-right');
export const FiClock         = makeIcon('clock');
export const FiDollarSign    = makeIcon('currency-dollar');
export const FiEdit2         = makeIcon('pencil');
export const FiEye           = makeIcon('eye');
export const FiEyeOff        = makeIcon('eye-slash');
export const FiFileText      = makeIcon('file-text');
export const FiGlobe         = makeIcon('globe');
export const FiGrid          = makeIcon('grid');
export const FiHeart         = makeIcon('heart');
export const FiHelpCircle    = makeIcon('question-circle');
export const FiHome          = makeIcon('house');
export const FiImage         = makeIcon('image');
export const FiInbox         = makeIcon('inbox');
export const FiList          = makeIcon('list-ul');
export const FiLock          = makeIcon('lock');
export const FiLogOut        = makeIcon('box-arrow-right');
export const FiMail          = makeIcon('envelope');
export const FiMapPin        = makeIcon('geo-alt');
export const FiMenu          = makeIcon('list');
export const FiMessageCircle = makeIcon('chat-dots');
export const FiMonitor       = makeIcon('display');
export const FiMoon          = makeIcon('moon');
export const FiMoreVertical  = makeIcon('three-dots-vertical');
export const FiPackage       = makeIcon('box-seam');
export const FiPhone         = makeIcon('telephone');
export const FiPlus          = makeIcon('plus-lg');
export const FiPrinter       = makeIcon('printer');
export const FiRefreshCw     = makeIcon('arrow-clockwise');
export const FiSave          = makeIcon('save');
export const FiSearch        = makeIcon('search');
export const FiSend          = makeIcon('send');
export const FiSettings      = makeIcon('gear');
export const FiShare2        = makeIcon('share');
export const FiShield        = makeIcon('shield');
export const FiShieldOff     = makeIcon('shield-slash');
export const FiSmartphone    = makeIcon('phone');
export const FiSmile         = makeIcon('emoji-smile');
export const FiStar          = makeIcon('star-fill');
export const FiSun           = makeIcon('sun');
export const FiTag           = makeIcon('tag');
export const FiThumbsUp      = makeIcon('hand-thumbs-up');
export const FiTool          = makeIcon('tools');
export const FiTrash2        = makeIcon('trash');
export const FiTrendingUp    = makeIcon('graph-up-arrow');
export const FiUnlock        = makeIcon('unlock');
export const FiUpload        = makeIcon('upload');
export const FiX             = makeIcon('x-lg');
export const FiUser          = makeIcon('person');
export const FiXCircle       = makeIcon('x-circle');
export const FiZap           = makeIcon('lightning-charge-fill');
