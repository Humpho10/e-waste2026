// Brand palette + shared Highcharts base theme for the PM workspace.
export const CHART_COLORS = {
  teal:     '#0d9488',
  approved: '#10b981',
  pending:  '#f59e0b',
  rejected: '#ef4444',
  slate:    '#64748b',
};

// Shared base theme so every chart on the dashboard feels like one family.
export const chartBase = {
  chart: {
    backgroundColor: 'transparent',
    style: { fontFamily: 'inherit' },
    spacing: [12, 8, 12, 8],
  },
  title: { text: undefined },
  credits: { enabled: false },
  legend: {
    itemStyle: { color: '#475569', fontWeight: '500', fontSize: '12px' },
    itemHoverStyle: { color: '#0f172a' },
  },
  accessibility: { enabled: false },
  xAxis: {
    lineColor: '#e2e8f0',
    tickColor: '#e2e8f0',
    labels: { style: { color: '#94a3b8', fontSize: '11px' } },
  },
  yAxis: {
    gridLineColor: '#f1f5f9',
    title: { text: null },
    labels: { style: { color: '#94a3b8', fontSize: '11px' } },
  },
  tooltip: {
    backgroundColor: '#0f172a',
    borderWidth: 0,
    borderRadius: 10,
    shadow: false,
    style: { color: '#fff', fontSize: '12px' },
    useHTML: true,
  },
  plotOptions: {
    series: { animation: { duration: 700 } },
  },
};
