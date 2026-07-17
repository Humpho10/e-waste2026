import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { chartBase } from '../lib/chartTheme';

// Under Vite's CJS interop, the default import resolves to the module object
// ({ HighchartsReact, default }) rather than the component itself. Unwrap it
// so we always end up with the actual React component regardless of interop.
const HighchartsReact =
  HighchartsReactModule.HighchartsReact ||
  HighchartsReactModule.default ||
  HighchartsReactModule;

/**
 * Themed Highcharts wrapper. Pass a partial `options` object; it is deep-merged
 * over the shared brand theme in ../lib/chartTheme.
 *
 * Highcharts only reflows on window resize, so a chart rendered before its
 * container changes size (sidebar collapse, mobile drawer, grid reflow) keeps
 * its stale width and overflows on small screens. A ResizeObserver on the
 * container keeps the chart matched to whatever space it actually has.
 */
export default function Chart({ options }) {
  const chartRef = useRef(null);

  useEffect(() => {
    const container = chartRef.current?.container?.current;
    const chart = chartRef.current?.chart;
    if (!container || !chart) return;

    let frame = null;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Guard: the chart may already be destroyed on unmount.
        if (chartRef.current?.chart) chartRef.current.chart.reflow();
      });
    });
    observer.observe(container.parentElement || container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <HighchartsReact
      ref={chartRef}
      highcharts={Highcharts}
      containerProps={{ style: { width: '100%', overflow: 'hidden' } }}
      options={Highcharts.merge(true, {}, chartBase, options)}
    />
  );
}
