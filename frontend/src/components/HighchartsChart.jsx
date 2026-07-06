import { useEffect, useRef } from 'react';
import { loadHighcharts } from '../lib/loadHighcharts';
import { useTheme } from '../context/ThemeContext';

const BRAND_COLORS = ['#2563eb', '#f97316', '#14b8a6', '#a855f7', '#22c55e', '#eab308'];

/**
 * Renders a real Highcharts chart into a div, loaded lazily from the CDN.
 * Handles dark/light re-theming automatically (Highcharts has no CSS-variable
 * awareness, so its colors have to be pushed in explicitly whenever the app
 * theme flips) and cleans itself up on unmount.
 *
 * `options` should be a plain Highcharts config *without* chart-level theme
 * concerns (background, grid/axis/legend/tooltip colors) — those are merged
 * in here so every chart on the dashboard stays visually consistent.
 */
export default function HighchartsChart({ options, height = 260, className = '' }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    let cancelled = false;

    loadHighcharts().then((Highcharts) => {
      if (cancelled || !containerRef.current) return;

      const axisText  = isDark ? '#64748b' : '#9ca3af';
      const gridColor = isDark ? '#1e293b' : '#f3f4f6';

      const themed = {
        chart: {
          backgroundColor: 'transparent',
          style: { fontFamily: 'inherit' },
          spacing: [8, 8, 8, 8],
          ...options.chart,
          height,
        },
        title: { text: undefined },
        credits: { enabled: false },
        colors: options.colors || BRAND_COLORS,
        xAxis: {
          lineColor: gridColor,
          tickColor: gridColor,
          gridLineColor: gridColor,
          labels: { style: { color: axisText, fontSize: '11px' } },
          ...options.xAxis,
        },
        yAxis: {
          gridLineColor: gridColor,
          labels: { style: { color: axisText, fontSize: '11px' } },
          title: { text: null },
          ...options.yAxis,
        },
        legend: {
          itemStyle: { color: isDark ? '#cbd5e1' : '#4b5563', fontWeight: 500, fontSize: '12px' },
          itemHoverStyle: { color: isDark ? '#ffffff' : '#111827' },
          ...options.legend,
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e5e7eb',
          borderRadius: 10,
          shadow: true,
          style: { color: isDark ? '#e2e8f0' : '#374151', fontSize: '12px' },
          ...options.tooltip,
        },
        plotOptions: options.plotOptions,
        series: options.series,
        pane: options.pane,
        accessibility: { enabled: true },
      };

      if (chartRef.current) {
        chartRef.current.update(themed, true, true);
      } else {
        chartRef.current = Highcharts.chart(containerRef.current, themed);
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, isDark, height]);

  // Destroy the chart instance only when this component actually unmounts.
  useEffect(() => () => { chartRef.current?.destroy(); chartRef.current = null; }, []);

  return <div ref={containerRef} className={className} style={{ height, width: '100%' }} />;
}
