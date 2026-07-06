import React from 'react';
import PropTypes from 'prop-types';
import { Star, Eye, Bell, BarChart2 } from 'lucide-react';
import { CATEGORIES } from './reportCatalog';

import { doExportCSV, doExportImage } from './reportExportUtils';
import { toast } from 'react-hot-toast';
import { fmtDateTime, fmtDateTimeEnd, monthStart, today } from './reportCatalog';

/**
 * Individual report card shown in the catalog grid.
 * Displays the report name, description, category icon, and action buttons.
 */
export default function ReportCard({ report, isFav, onToggleFav, onOpen, onSchedule }) {
  const catIcon = CATEGORIES.find(c => c.id === report.category);
  const CatIcon = catIcon?.icon || BarChart2;

  const handleQuickExport = async (type) => {
    try {
      const res = await report.endpoint(fmtDateTime(monthStart), fmtDateTimeEnd(today), {});
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        if (type === 'csv') doExportCSV(report, data);
        // Note: Image export requires a DOM element, which we don't have here since preview is not open
        // So for Image export on card level, it's not straightforward unless we render it hidden or just alert
        else toast('Image export requires generating the preview first.', { icon: 'ℹ️' });
      } else {
        toast.error('Quick export is not supported for summary reports');
      }
    } catch {
      toast.error(`Failed to export ${type.toUpperCase()}`);
    }
  };

  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col gap-3 hover:shadow-sm transition-all cursor-default ${
      report.isNarcotic ? 'border-purple-200 bg-purple-50/20' : report.isRestricted ? 'border-purple-100' : 'border-slate-100'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            report.isNarcotic ? 'bg-purple-100' : report.isRestricted ? 'bg-purple-50' : 'bg-slate-50'
          }`}>
            <CatIcon className={`w-4 h-4 ${catIcon?.color || 'text-slate-500'}`} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700 leading-tight">{report.name}</div>
            {report.isNarcotic && (
              <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider bg-purple-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                NDPS Mandatory
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onToggleFav(report.id)}
          aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
          className={`p-1 rounded transition-colors flex-shrink-0 ${isFav ? 'text-amber-400 hover:text-amber-500' : 'text-slate-200 hover:text-amber-300'}`}
        >
          <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">{report.desc}</p>

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => onOpen(report)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-3 h-3" /> Generate
        </button>
        <button
          onClick={() => handleQuickExport('csv')}
          title="Quick Export CSV (This Month)"
          className="px-3 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          CSV
        </button>
        <button
          onClick={() => onSchedule(report)}
          aria-label="Schedule report"
          className="px-3 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Bell className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

ReportCard.propTypes = {
  report:       PropTypes.shape({
    id:          PropTypes.string.isRequired,
    name:        PropTypes.string.isRequired,
    desc:        PropTypes.string.isRequired,
    category:    PropTypes.string.isRequired,
    isNarcotic:  PropTypes.bool,
    isRestricted: PropTypes.bool,
  }).isRequired,
  isFav:        PropTypes.bool.isRequired,
  onToggleFav:  PropTypes.func.isRequired,
  onOpen:       PropTypes.func.isRequired,
  onSchedule:   PropTypes.func.isRequired,
};
