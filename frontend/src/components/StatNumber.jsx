import { useEffect, useState } from 'react';

// Animated count-up for live counters.
export function CountUp({ value, className }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const fmt = (n) => (n >= 1000 ? `${n.toLocaleString()}+` : n.toLocaleString());
  return <span className={className}>{fmt(display)}</span>;
}

// Loading shimmer → animated real value (→ static fallback only on error).
export default function StatNumber({ value, error, fallback, className }) {
  const cls = className || 'font-bold text-gray-800 text-sm leading-none';
  if (value != null) return <CountUp value={value} className={cls} />;
  if (error) return <p className={cls}>{fallback}</p>;
  return <span className="inline-block h-4 w-12 bg-gray-200 rounded animate-pulse" />;
}
