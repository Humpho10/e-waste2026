import { useEffect, useState } from 'react';
import { ArrowUp } from './icons';

// Floating "back to top" button — fades in once the page has been scrolled
// down a bit, so it doesn't clutter the view near the top of the page.
export default function BackToTopButton({ threshold = 480 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#0b2545] text-white shadow-lg
        flex items-center justify-center hover:bg-blue-700 transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <ArrowUp width={18} height={18} />
    </button>
  );
}
