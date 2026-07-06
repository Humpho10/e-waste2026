import { useId, useState } from 'react';

// ── Dependency-free SVG chart primitives ────────────────────────
// Small, purpose-built charts for the admin dashboard. No charting
// library required — everything below is plain SVG + a bit of path
// math, so it never needs an npm install to render.

// Smooths a polyline into a soft curve using quadratic bezier
// mid-point smoothing (cheap, good-looking enough for small charts).
function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    d += ` Q ${x1} ${y1} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last[0]} ${last[1]}`;
  return d;
}

/** Tiny inline trend line for a stat card — no axes, just the shape. */
export function Sparkline({ data = [], color = '#2563eb', height = 44, width = 160 }) {
  const gradId = useId();
  if (!data.length) return <div style={{ height }} />;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 4;
  const points = data.map((v, i) => [
    pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2),
    height - pad - ((v - min) / range) * (height - pad * 2),
  ]);
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${height} L ${points[0][0]} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Larger area chart with axis labels + hover tooltip, for the main
 * "trend over time" card. `data` is [{ label, value }].
 */
export function AreaTrendChart({ data = [], color = '#2563eb', height = 220 }) {
  const gradId = useId();
  const [hover, setHover] = useState(null);
  const width = 600; // virtual coordinate space; SVG scales via viewBox
  const padL = 34, padR = 8, padT = 12, padB = 24;

  if (!data.length) {
    return <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No data yet</div>;
  }

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min || 1;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const points = data.map((d, i) => [
    padL + (i / Math.max(data.length - 1, 1)) * innerW,
    padT + innerH - ((d.value - min) / range) * innerH,
  ]);
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${padT + innerH} L ${points[0][0]} ${padT + innerH} Z`;

  const yTicks = 4;
  const yGrid = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = Math.round((max / yTicks) * i);
    const y = padT + innerH - (v / range) * innerH;
    return { v, y };
  });

  // Show roughly 6 evenly-spaced x labels regardless of data length.
  const xLabelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible select-none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines + y labels */}
      {yGrid.map(({ v, y }) => (
        <g key={v}>
          <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-slate-800" />
          <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="currentColor" className="text-gray-400 dark:text-gray-500">{v}</text>
        </g>
      ))}

      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* X labels */}
      {data.map((d, i) => (
        i % xLabelEvery === 0 && (
          <text key={i} x={points[i][0]} y={height - 4} textAnchor="middle" fontSize="10" fill="currentColor" className="text-gray-400 dark:text-gray-500">
            {d.label}
          </text>
        )
      ))}

      {/* Hover targets + tooltip */}
      {points.map(([x, y], i) => (
        <g key={i}>
          <rect
            x={x - (innerW / data.length) / 2} y={padT} width={innerW / data.length} height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
          {hover === i && (
            <>
              <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={x} cy={y} r="4" fill={color} stroke="white" strokeWidth="1.5" />
            </>
          )}
        </g>
      ))}

      {hover !== null && (
        <foreignObject x={Math.min(Math.max(points[hover][0] - 45, 0), width - 90)} y={Math.max(points[hover][1] - 46, 0)} width="90" height="36">
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-lg px-2 py-1 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{data[hover].label}</p>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{data[hover].value}</p>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}

/** Donut chart with a big center label — pairs with an external legend. */
export function DonutChart({ data = [], colors = [], centerLabel, centerValue, size = 180, thickness = 26 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2;
  const innerRadius = radius - thickness;
  const cx = radius, cy = radius;

  let cumulative = 0;
  const arcs = data.map((d, i) => {
    const fraction = d.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const path = data.length === 1
      ? null // single-slice ring drawn separately below
      : [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

    return { path, color: colors[i % colors.length], name: d.name, value: d.value };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height={size} className="overflow-visible">
      {data.length === 1 ? (
        <circle cx={cx} cy={cy} r={(radius + innerRadius) / 2} fill="none" stroke={colors[0]} strokeWidth={thickness} />
      ) : (
        arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} className="transition-opacity hover:opacity-80" />
        ))
      )}
      {(centerLabel || centerValue !== undefined) && (
        <g>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor" className="text-gray-800 dark:text-gray-100">
            {centerValue}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="currentColor" className="text-gray-400 dark:text-gray-500">
            {centerLabel}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Horizontal bar chart — good for "top N" style breakdowns. */
export function HorizontalBarChart({ data = [], colors = [] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.name} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-300 font-medium truncate">{d.name}</span>
            <span className="text-gray-400 dark:text-gray-500 shrink-0 ml-2">{d.value.toLocaleString()}</span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="animate-progress-fill h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: colors[i % colors.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
