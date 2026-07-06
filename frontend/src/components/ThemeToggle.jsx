import { useTheme } from '../context/ThemeContext';

// Sun / moon icons, dependency-free (matches the style of components/icons.jsx).
function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

const VARIANTS = {
  // Default: fits the light dashboard header chips (gray-50 pill).
  light: `
    bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700
    text-gray-500 dark:text-gray-400
    hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-white
  `,
  // For placement on the always-navy public navbar / brand panel.
  navbar: `
    bg-white/10 border border-white/20 text-blue-100
    hover:bg-white/20 hover:text-white
  `,
};

/**
 * Compact icon-button theme toggle. Drop into any header — reads/writes the
 * shared ThemeContext so state stays in sync across every layout.
 */
export default function ThemeToggle({ className = '', variant = 'light' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative w-9 h-9 rounded-xl shrink-0
        flex items-center justify-center
        transition-colors duration-150
        ${VARIANTS[variant] || VARIANTS.light}
        ${className}
      `}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
