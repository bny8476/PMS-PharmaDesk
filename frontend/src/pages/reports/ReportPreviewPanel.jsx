import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  BarChart2, Calendar, FileSpreadsheet, FileText,
  Bell, X, RefreshCcw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { today, monthStart, fmtDateTime, fmtDateTimeEnd, fmtDate, urgencyBadge } from './reportCatalog';
import { doExportPDF, doExportExcel, doExportCSV, doExportImage } from './reportExportUtils';
import { Image, FileType } from 'lucide-react';

/**
 * Inline panel that shows the report filter controls, fetches data,
 * and renders it in a virtualized table.
 */
export default function ReportPreviewPanel({ report, onClose, onSchedule }) {
  const [from, setFrom]         = useState(monthStart);
  const [to, setTo]             = useState(today);
  const [extraFilters, setExtraFilters] = useState(
    Object.fromEntries((report.extraFilters || []).map(ef => [ef.key, ef.default]))
  );
  const [data, setData]         = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const tableContainerRef = useRef(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res     = await report.endpoint(fmtDateTime(from), fmtDateTimeEnd(to), extraFilters);
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) {
        setData(payload);
        setSummary(null);
      } else if (payload && typeof payload === 'object') {
        setSummary(payload);
        setData([]);
      }
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [report, from, to, extraFilters]);

  // Auto-generate on mount
  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filterStr = `${from} to ${to}${Object.entries(extraFilters).map(([k, v]) => `, ${k}: ${v}`).join('')}`;

  const renderCell = (row, col) => {
    const val = row[col];
    if (val == null) return <span className="text-slate-300">—</span>;
    if (col === 'urgency') return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${urgencyBadge(val)}`}>
        {val?.replace('_', ' ')}
      </span>
    );
    if (col === 'status') return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
        val === 'PAID' || val === 'ACTIVE' || val === 'CONFIRMED'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : val === 'PENDING' || val === 'DRAFT'
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : val === 'CANCELLED' || val === 'EXPIRED'
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-slate-100 text-slate-600'
      }`}>{val}</span>
    );
    if (typeof val === 'number') return (
      <span className="font-mono text-slate-700">
        {Number.isInteger(val) ? val.toLocaleString() : `₹${val.toFixed(2)}`}
      </span>
    );
    if (typeof val === 'string' && val.includes('T')) return <span className="text-slate-500">{fmtDate(val)}</span>;
    return <span className="text-slate-700">{String(val)}</span>;
  };

  // Numeric column totals
  const numericCols = data.length > 0
    ? report.columns.filter(col => typeof data[0][col] === 'number')
    : [];

  // Virtualizer
  const rowVirtualizer    = useVirtualizer({
    count: data.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });
  const virtualItems  = rowVirtualizer.getVirtualItems();
  const paddingTop    = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} aria-label="Close preview" className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-slate-800">{report.name}</h3>
            {report.isRestricted && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200">
                ACCESS CONTROLLED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 ml-6 mt-0.5">{report.desc}</p>
        </div>

        {/* Export + Schedule actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => doExportCSV(report, data)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FileType className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => doExportExcel(report, data)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={() => doExportPDF(report, data, filterStr)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={() => doExportImage(tableContainerRef.current, report.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Image className="w-3.5 h-3.5" /> JPG
          </button>
          <button
            onClick={onSchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" /> Schedule
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        {report.hasDateRange && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="flex gap-1">
              {[['Today', 'today'], ['This Month', 'month'], ['Last 7d', 'week']].map(([label, preset]) => (
                <button key={preset} onClick={() => {
                  const n = new Date();
                  if (preset === 'today')      { setFrom(today); setTo(today); }
                  else if (preset === 'month') { setFrom(monthStart); setTo(today); }
                  else { setFrom(new Date(n.setDate(n.getDate() - 7)).toISOString().split('T')[0]); setTo(today); }
                }} className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {(report.extraFilters || []).map(ef => (
          <div key={ef.key} className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">{ef.label}:</label>
            <input type={ef.type} value={extraFilters[ef.key] ?? ef.default}
              onChange={e => setExtraFilters(p => ({ ...p, [ef.key]: e.target.value }))}
              className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        ))}

        <button onClick={generate} disabled={loading}
          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
        <span className="ml-auto text-xs text-slate-400 self-center">{data.length} records</span>
      </div>

      {/* Summary cards (for object responses) */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary).map(([k, v]) => (
            <div key={k} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm font-bold text-slate-800">
                {typeof v === 'number'
                  ? (Number.isInteger(v) ? v.toLocaleString() : `₹${Number(v).toFixed(2)}`)
                  : String(v)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Virtualized data table */}
      {data.length > 0 && (
        <div ref={tableContainerRef} className="overflow-auto max-h-[400px] border border-slate-100 rounded-xl relative">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                {report.headers.map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paddingTop > 0 && <tr><td style={{ height: `${paddingTop}px` }} colSpan={report.columns.length} /></tr>}
              {virtualItems.map(virtualRow => {
                const i   = virtualRow.index;
                const row = data[i];
                return (
                  <tr key={i} data-index={i} ref={rowVirtualizer.measureElement}
                    className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    {report.columns.map(col => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap">{renderCell(row, col)}</td>
                    ))}
                  </tr>
                );
              })}
              {paddingBottom > 0 && <tr><td style={{ height: `${paddingBottom}px` }} colSpan={report.columns.length} /></tr>}
            </tbody>
            {numericCols.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-slate-100 shadow-[0_-1px_0_0_#e2e8f0]">
                <tr className="font-bold">
                  {report.columns.map(col => (
                    <td key={col} className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100">
                      {numericCols.includes(col)
                        ? `₹${data.reduce((s, r) => s + (Number(r[col]) || 0), 0).toFixed(2)}`
                        : col === report.columns[0] ? 'TOTAL' : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && data.length === 0 && !summary && (
        <div className="text-center py-10 text-slate-400">
          <BarChart2 className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-sm font-bold">No data for selected filters</p>
          <p className="text-xs mt-1">Adjust the date range or click Generate Report</p>
        </div>
      )}
    </div>
  );
}

ReportPreviewPanel.propTypes = {
  report:     PropTypes.object.isRequired,
  onClose:    PropTypes.func.isRequired,
  onSchedule: PropTypes.func.isRequired,
};
