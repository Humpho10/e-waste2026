import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number counting up from 0 (or its previous value) to `target`
 * whenever `target` changes. Used on dashboard stat cards so numbers feel
 * alive once the real data arrives instead of just popping in.
 */
export function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const end = Number(target) || 0;
    const start = fromRef.current;
    const startTime = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Respect users who've asked for reduced motion — just snap to the value.
    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || start === end) {
      setValue(end);
      fromRef.current = end;
      return;
    }

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}
