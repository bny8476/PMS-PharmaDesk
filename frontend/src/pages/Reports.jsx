import React, { useState } from 'react';
import { Search, Star, Shield, X } from 'lucide-react';
import OTPVerificationModal from '../components/auth/OTPVerificationModal';
import { REPORT_CATALOG, CATEGORIES } from './reports/reportCatalog';
import ReportCard          from './reports/ReportCard';
import ReportPreviewPanel  from './reports/ReportPreviewPanel';
import ScheduleDrawer      from './reports/ScheduleDrawer';
import SchedulesTab        from './reports/SchedulesTab';

/**
 * Reports & Analytics page — orchestrates catalog browsing, OTP-gated access,
 * inline preview, and scheduled delivery management.
 *
 * Business logic lives in sub-components; this file is intentionally thin
 * (~100 lines) to serve only as a layout/state coordinator.
 */
export default function Reports() {
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [searchTerm,      setSearchTerm]      = useState('');
  const [favourites,      setFavourites]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('rpt_favs') || '[]'); } catch { return []; }
  });
  const [openReport,      setOpenReport]      = useState(null);
  const [scheduleReport,  setScheduleReport]  = useState(null);
  const [isOtpOpen,       setIsOtpOpen]       = useState(false);
  const [pendingReport,   setPendingReport]   = useState(null);
  const [verifiedEmail,   setVerifiedEmail]   = useState(false);

  const toggleFav = (id) => {
    setFavourites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('rpt_favs', JSON.stringify(next));
      return next;
    });
  };

  const handleOpenReport = (report) => {
    if (report.isRestricted && !verifiedEmail) {
      setPendingReport(report);
      setIsOtpOpen(true);
    } else {
      setOpenReport(report);
    }
  };

  const filteredReports = REPORT_CATALOG.filter(r => {
    const matchCat    = activeCategory === 'all' || activeCategory === 'schedules' || r.category === activeCategory;
    const matchSearch = !searchTerm ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const favReports = REPORT_CATALOG.filter(r => favourites.includes(r.id));
  const catGroups  = activeCategory === 'all'
    ? CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'schedules')
    : [CATEGORIES.find(c => c.id === activeCategory)].filter(Boolean);

  return (
    <div className="space-y-5">
      {/* OTP gate for restricted compliance reports */}
      <OTPVerificationModal
        isOpen={isOtpOpen}
        onClose={() => { setIsOtpOpen(false); setPendingReport(null); }}
        onVerifySuccess={() => {
          setVerifiedEmail(true);
          setOpenReport(pendingReport);
          setPendingReport(null);
        }}
      />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports &amp; Analytics</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {REPORT_CATALOG.length} reports across {CATEGORIES.length - 2} categories — sales, stock, procurement, GST, compliance &amp; clinical
          </p>
        </div>
      </div>

      {/* Global search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search reports — e.g. 'GSTR-1', 'narcotic', 'expiry', 'payables'…"
          className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white shadow-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}>
              <CatIcon className="w-3.5 h-3.5" />{cat.label}
              {cat.id !== 'all' && cat.id !== 'schedules' && (
                <span className={`text-[10px] px-1 rounded ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {REPORT_CATALOG.filter(r => r.category === cat.id).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inline report preview */}
      {openReport && (
        <div className="bg-white rounded-xl border border-blue-100 p-5">
          <ReportPreviewPanel
            report={openReport}
            onClose={() => setOpenReport(null)}
            onSchedule={() => setScheduleReport(openReport)}
          />
        </div>
      )}

      {/* Schedules management tab */}
      {activeCategory === 'schedules' && !openReport && <SchedulesTab />}

      {/* Favourites strip */}
      {activeCategory !== 'schedules' && favReports.length > 0 && !searchTerm && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            <h3 className="text-sm font-bold text-slate-700">Favourites</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {favReports.map(r => (
              <ReportCard key={r.id} report={r}
                isFav={favourites.includes(r.id)}
                onToggleFav={toggleFav}
                onOpen={handleOpenReport}
                onSchedule={setScheduleReport}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category groups */}
      {activeCategory !== 'schedules' && catGroups.map(cat => {
        if (!cat) return null;
        const catReports = filteredReports.filter(r => r.category === cat.id);
        if (catReports.length === 0) return null;
        const CatIcon = cat.icon;
        return (
          <div key={cat.id} className="space-y-3">
            <div className="flex items-center gap-2 pt-1">
              <CatIcon className={`w-4 h-4 ${cat.color}`} />
              <h3 className="text-sm font-bold text-slate-700">{cat.label}</h3>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                {catReports.length} reports
              </span>
              {cat.id === 'compliance' && (
                <span className="text-[10px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> Role-restricted
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catReports.map(r => (
                <ReportCard key={r.id} report={r}
                  isFav={favourites.includes(r.id)}
                  onToggleFav={toggleFav}
                  onOpen={handleOpenReport}
                  onSchedule={setScheduleReport}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty search state */}
      {searchTerm && filteredReports.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No reports match &quot;{searchTerm}&quot;</p>
          <p className="text-xs text-slate-300 mt-1">Try 'sales', 'expiry', 'GSTR', 'narcotic', or 'supplier'</p>
        </div>
      )}

      {/* Schedule drawer modal */}
      {scheduleReport && (
        <ScheduleDrawer
          report={scheduleReport}
          onClose={() => setScheduleReport(null)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
