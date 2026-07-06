// Loads Highcharts (+ the "more" and "solid-gauge" modules it needs for the
// admin dashboard's radial gauges) from the CDN, exactly once, regardless of
// how many chart components mount at the same time. No npm install / bundler
// dependency required — this mirrors the same dynamic-script-tag pattern
// already used for Google Identity Services in GoogleAuthButton.jsx.

const SCRIPTS = [
  'https://code.highcharts.com/highcharts.js',
  'https://code.highcharts.com/highcharts-more.js',
  'https://code.highcharts.com/modules/solid-gauge.js',
  'https://code.highcharts.com/modules/accessibility.js',
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = 'true'; resolve(); };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

let highchartsPromise = null;

export function loadHighcharts() {
  if (typeof window !== 'undefined' && window.Highcharts) return Promise.resolve(window.Highcharts);
  if (highchartsPromise) return highchartsPromise;

  highchartsPromise = SCRIPTS
    .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
    .then(() => window.Highcharts);

  return highchartsPromise;
}
