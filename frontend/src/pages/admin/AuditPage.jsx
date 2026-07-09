import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Bi from '../../components/BsIcon';
import { getAuditTrail, exportAuditTrail } from '../../api/admin';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ACTION_STYLES = {
  created:                 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  updated:                 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  deleted:                 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  approved_by_management:  'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400',
  rejected_by_management:  'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
};

const ACTION_ICONS = {
  created:                 'plus-circle-fill',
  updated:                 'pencil-fill',
  deleted:                 'trash-fill',
  approved_by_management:  'check-circle-fill',
  rejected_by_management:  'x-circle-fill',
};

function actionStyle(action) {
  return ACTION_STYLES[action] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300';
}

function actionIcon(action) {
  return ACTION_ICONS[action] || 'activity';
}

function actionLabel(action = '') {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const TABLE_LABELS = {
  products: 'Products',
  categories: 'Categories',
  subcategories: 'Subcategories',
  sub_categories: 'Subcategories',
  users: 'Users',
  product_manager_assignments: 'PM Assignments',
};

function tableLabel(name = '') {
  return TABLE_LABELS[name] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatDiffValue(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
}

function DiffItem({ field, oldVal, newVal, oldObj, newObj }) {
  const isChanged = JSON.stringify(oldObj[field]) !== JSON.stringify(newObj[field]);
  if (!isChanged) return null;

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 gap-3">
      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize flex-shrink-0">{field.replace(/_/g, ' ')}</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-xs text-red-600 dark:text-red-400 font-medium text-right max-w-[120px] truncate" title={String(oldVal ?? '—')}>
          {formatDiffValue(oldVal)}
        </span>
        <Bi name="arrow-right" size={10} className="text-gray-400 flex-shrink-0" />
        <span className="text-xs text-green-600 dark:text-green-400 font-medium text-right max-w-[120px] truncate" title={String(newVal ?? '—')}>
          {formatDiffValue(newVal)}
        </span>
      </div>
    </div>
  );
}

function DiffViewer({ label, value, tone, otherValue }) {
  const isEmpty = value === null || value === undefined || (typeof value === 'object' && Object.keys(value).length === 0);

  let parsedValue = value;
  let parsedOther = otherValue;

  try {
    if (typeof value === 'string' && value.startsWith('{')) {
      parsedValue = JSON.parse(value);
    }
    if (typeof otherValue === 'string' && otherValue.startsWith('{')) {
      parsedOther = JSON.parse(otherValue);
    }
  } catch (e) {
    // Keep as is
  }

  const isObject = typeof parsedValue === 'object' && parsedValue !== null;
  const otherIsObject = typeof parsedOther === 'object' && parsedOther !== null;

  if (isEmpty && (!otherIsObject || !otherValue)) {
    return (
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${tone}`}>{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">— none —</p>
      </div>
    );
  }

  if (!isObject) {
    return (
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${tone}`}>{label}</p>
        <div className="text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-lg p-3 text-gray-700 dark:text-gray-300">
          {formatDiffValue(value)}
        </div>
      </div>
    );
  }

  const allKeys = new Set([...Object.keys(parsedValue || {}), ...Object.keys(parsedOther || {})]);
  const skipKeys = ['id', 'created_at', 'updated_at', 'pivot', 'model_type', 'guard_name', 'email_verified_at', 'password', 'remember_token'];
  const filteredKeys = [...allKeys].filter(k => !skipKeys.includes(k));

  return (
    <div className="flex-1 min-w-0">
      <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${tone}`}>{label}</p>
      <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-xl p-3 max-h-64 overflow-y-auto">
        {filteredKeys.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">No detailed changes</p>
        ) : (
          <div className="space-y-0.5">
            {filteredKeys.map(key => (
              <DiffItem
                key={key}
                field={key}
                oldVal={parsedValue?.[key]}
                newVal={parsedOther?.[key]}
                oldObj={parsedValue}
                newObj={parsedOther}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditDetailModal({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${actionStyle(entry.action)}`}>
                <Bi name={actionIcon(entry.action)} size={18} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{actionLabel(entry.action)}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tableLabel(entry.table)} · Record #{entry.record_id} · {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition flex items-center justify-center">
              <Bi name="x-lg" size={14} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
              {entry.user.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{entry.user}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.email || 'No email on record'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <DiffViewer label="Before" value={entry.old_value} otherValue={entry.new_value} tone="text-red-500 dark:text-red-400" />
            <DiffViewer label="After" value={entry.new_value} otherValue={entry.old_value} tone="text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const EXPORT_FORMATS = [
  {
    id: 'pdf',
    name: 'PDF',
    desc: 'Portable Document Format',
    icon: 'file-earmark-pdf-fill',
    color: 'from-red-500 to-rose-600',
    mimeType: 'application/pdf',
    ext: 'pdf',
  },
  {
    id: 'xlsx',
    name: 'Excel',
    desc: 'Microsoft Excel Spreadsheet',
    icon: 'file-earmark-excel-fill',
    color: 'from-emerald-500 to-green-600',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: 'xlsx',
  },
];

function ExportModal({ onClose, onExport, exporting, filters, meta, search }) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);

  const activeFilters = useMemo(() => {
    const f = [];
    if (search) f.push({ label: 'Search', value: search });
    if (filters.action !== 'all') f.push({ label: 'Action', value: actionLabel(filters.action) });
    if (filters.table !== 'all') f.push({ label: 'Table', value: tableLabel(filters.table) });
    if (filters.dateFrom) f.push({ label: 'From', value: filters.dateFrom });
    if (filters.dateTo) f.push({ label: 'To', value: filters.dateTo });
    return f;
  }, [filters, search]);

  const format = EXPORT_FORMATS.find(f => f.id === selectedFormat);
  const estimatedCount = meta?.total || 0;
  const maxExport = 5000;
  const willBeCapped = estimatedCount > maxExport;

  const handleExport = () => {
    onExport(selectedFormat, { includeDetails });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Bi name="file-earmark-zip-fill" className="text-white" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Export Audit Trail</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Download audit data in your preferred format</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2.5">
              <span className="flex items-center gap-2">
                <Bi name="grid-3x3-gap-fill" size={13} className="text-blue-500" />
                Select Format
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {EXPORT_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedFormat === fmt.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/20'
                      : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${fmt.color} flex items-center justify-center mb-2 shadow-sm`}>
                    <Bi name={fmt.icon} className="text-white" size={16} />
                  </div>
                  <p className={`text-xs font-bold ${selectedFormat === fmt.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>{fmt.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{fmt.desc}</p>
                  {selectedFormat === fmt.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Bi name="check-lg" className="text-white" size={8} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2.5">
              <span className="flex items-center gap-2">
                <Bi name="funnel-fill" size={13} className="text-blue-500" />
                Export Summary
              </span>
            </label>
            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Records to export</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">
                  {estimatedCount.toLocaleString()} {willBeCapped && <span className="text-amber-500">(capped at {maxExport.toLocaleString()})</span>}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Format</span>
                <span className="font-medium text-gray-700 dark:text-gray-200 uppercase">{format?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">File size (est.)</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  ~{(estimatedCount * 0.15 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2.5">
                <span className="flex items-center gap-2">
                  <Bi name="-sliders" size={13} className="text-blue-500" />
                  Active Filters ({activeFilters.length})
                </span>
              </label>
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">
                <div className="flex flex-wrap gap-1.5">
                  {activeFilters.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 text-xs">
                      <span className="text-gray-400 dark:text-gray-500">{f.label}:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{f.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeDetails"
              checked={includeDetails}
              onChange={e => setIncludeDetails(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="includeDetails" className="text-sm text-gray-600 dark:text-gray-300">
              Include old/new values (JSON data)
            </label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900 flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || estimatedCount === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {exporting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Bi name="download" size={15} />
                Export {format?.name}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FILTERS = { action: 'all', table: 'all', dateFrom: '', dateTo: '', sort: 'desc' };

export default function AuditPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => { setPage(1); }, [search, filters.action, filters.table, filters.dateFrom, filters.dateTo, filters.sort, perPage]);

  const queryParams = useMemo(() => ({
    search: search || undefined,
    action: filters.action !== 'all' ? filters.action : undefined,
    table: filters.table !== 'all' ? filters.table : undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    sort: filters.sort,
    page,
    per_page: perPage,
  }), [search, filters, page, perPage]);

  const { data, isLoading: loading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['audit-trail', queryParams],
    queryFn: () => getAuditTrail(queryParams).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const audit         = data?.audit || [];
  const meta           = data?.meta || { current_page: 1, last_page: 1, per_page: perPage, total: 0 };
  const actionOptions  = data?.filter_options?.actions || [];
  const tableOptions   = data?.filter_options?.tables || [];

  const hasActiveFilters = Boolean(search) || filters.action !== 'all' || filters.table !== 'all' || filters.dateFrom || filters.dateTo;

  const clearFilters = () => {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
  };

  const handleExport = async (format, options) => {
    setExporting(true);
    setExportError('');
    try {
      const exportParams = {
        search: search || undefined,
        action: filters.action !== 'all' ? filters.action : undefined,
        table: filters.table !== 'all' ? filters.table : undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        sort: filters.sort,
        include_details: options.includeDetails ? 1 : 0,
      };

      const res = await exportAuditTrail(exportParams);
      const csvText = new TextDecoder().decode(res.data);
      const rows = parseCSV(csvText);

      if (!rows || rows.length < 2) {
        throw new Error('No data to export');
      }

      if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('E-Waste Mart', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Audit Trail Report', pageWidth / 2, 22, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Total Records: ${rows.length - 1}`, pageWidth / 2, 33, { align: 'center' });

        const headers = rows[0];
        const dataRows = rows.slice(1);

        const formattedData = dataRows.map(row => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = row[i] || ''; });
          return obj;
        });

        autoTable(doc, {
          head: [headers],
          body: formattedData.map(r => headers.map(h => formatCellValue(r[h]))),
          startY: 40,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 30 },
            2: { cellWidth: 45 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 15 },
            6: { cellWidth: 50 },
            7: { cellWidth: 50 },
            8: { cellWidth: 30 },
          },
          didDrawPage: function(data) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${data.pageNumber}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
          }
        });

        const footerY = doc.internal.pageSize.getHeight() - 5;
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text('E-Waste Mart - Confidential', 14, footerY);

        doc.save(`audit-trail-${new Date().toISOString().slice(0, 10)}.pdf`);
      } else if (format === 'xlsx') {
        const headers = rows[0];
        const dataRows = rows.slice(1);

        const wsData = [
          ['E-Waste Mart - Audit Trail Report'],
          [`Generated: ${new Date().toLocaleString()}`],
          [`Total Records: ${rows.length - 1}`],
          [],
          headers,
          ...dataRows.map(row => row.map(cell => formatCellValue(cell))),
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { wch: 8 }, { wch: 25 }, { wch: 35 }, { wch: 20 },
          { wch: 20 }, { wch: 12 }, { wch: 50 }, { wch: 50 }, { wch: 25 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit-trail-${new Date().toISOString().slice(0, 10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      setExportError(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const parseCSV = (text) => {
    if (!text || !text.trim()) return [];
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    return lines.map(line => parseCSVLine(line));
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const formatCellValue = (value) => {
    if (!value || value === 'null' || value === 'undefined') return '—';
    try {
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        const parsed = JSON.parse(value);
        const skip = ['id', 'created_at', 'updated_at', 'pivot', 'model_type', 'guard_name', 'email_verified_at'];
        const lines = [];
        const flatten = (obj, prefix = '') => {
          for (const [key, val] of Object.entries(obj)) {
            if (skip.includes(key) || val === null || val === undefined) continue;
            const label = prefix ? `${prefix}.${key}` : key;
            if (typeof val === 'object') {
              if (Array.isArray(val)) {
                val.forEach((v, i) => {
                  if (typeof v === 'object' && v !== null) {
                    flatten(v, `${label}[${i}]`);
                  } else if (v !== null) {
                    lines.push(`${label}[${i}]: ${v}`);
                  }
                });
              } else {
                flatten(val, label);
              }
            } else {
              lines.push(`${label}: ${val}`);
            }
          }
        };
        flatten(parsed);
        const display = lines.slice(0, 4).join(' | ');
        return lines.length > 4 ? display + ' | ...' : display;
      }
    } catch (e) {
      // Not JSON
    }
    const str = String(value);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bi name="file-earmark-text-fill" className="text-white" size={18} />
            </div>
            Audit Trail
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {meta.total.toLocaleString()} recorded event{meta.total === 1 ? '' : 's'} across the platform
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={exporting || loading || meta.total === 0}
          className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Bi name="file-earmark-zip-fill" size={15} />
          Export
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Export options
          </span>
        </button>
      </div>

      {exportError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <Bi name="exclamation-triangle-fill" size={14} />
          {exportError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Bi name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search user, email, action, table, or record ID..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All actions</option>
            {actionOptions.map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
          </select>

          <select
            value={filters.table}
            onChange={e => setFilters(f => ({ ...f, table: e.target.value }))}
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All tables</option>
            {tableOptions.map(t => <option key={t} value={t}>{tableLabel(t)}</option>)}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            title="From date"
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            title="To date"
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setFilters(f => ({ ...f, sort: f.sort === 'desc' ? 'asc' : 'desc' }))}
            title="Toggle sort order"
            className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <Bi name={filters.sort === 'desc' ? 'sort-down' : 'sort-up'} size={14} />
            {filters.sort === 'desc' ? 'Newest' : 'Oldest'}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 hover:underline px-2"
            >
              <Bi name="x-circle-fill" size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
          {error?.response?.data?.message || 'Failed to load the audit trail'} — <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
            <tr>
              {['#', 'User', 'Action', 'Table', 'Record', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i} className="border-t border-gray-50 dark:border-slate-800 animate-pulse">
                  <td className="px-4 py-3"><div className="h-3 w-4 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-32 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 dark:bg-slate-800 rounded-full" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-10 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : audit.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <Bi name="inbox" size={28} className="mx-auto mb-2 opacity-50" />
                  <p>No activity matches these filters</p>
                </td>
              </tr>
            ) : (
              audit.map((entry, i) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="border-t border-gray-50 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{(meta.current_page - 1) * meta.per_page + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {entry.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{entry.user}</p>
                        {entry.email && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{entry.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionStyle(entry.action)}`}>
                      <Bi name={actionIcon(entry.action)} size={11} />
                      {actionLabel(entry.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{tableLabel(entry.table)}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">#{entry.record_id}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium inline-flex items-center gap-1">
                      View <Bi name="arrow-right" size={11} />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && audit.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Showing {(meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total.toLocaleString()}
              </span>
              {isFetching && <Bi name="arrow-repeat" size={12} className="animate-spin text-blue-500" />}
              <select
                value={perPage}
                onChange={e => setPerPage(Number(e.target.value))}
                className="ml-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Bi name="chevron-left" size={11} />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Bi name="chevron-right" size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuditDetailModal entry={selected} onClose={() => setSelected(null)} />
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          exporting={exporting}
          filters={filters}
          meta={meta}
          search={search}
        />
      )}
    </AdminLayout>
  );
}