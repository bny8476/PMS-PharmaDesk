import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AppModal from '../../components/ui/AppModal';
import pharmacyService from '../../utils/pharmacyService';

const INPUT_CLS = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white';

/**
 * Modal form for creating or editing a scheduled report delivery.
 */
export default function ScheduleDrawer({ report, onClose, onSaved }) {
  const [form, setForm] = useState({
    scheduleName:     `${report.name} – Auto`,
    reportType:       report.id,
    reportCategory:   report.category,
    frequency:        'DAILY',
    deliveryTime:     '08:00',
    channels:         'EMAIL',
    emailRecipients:  '',
    whatsappNumbers:  '',
    fileFormats:      'PDF',
    active:           true,
    reportParams:     '',
  });

  const f = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      const res = await pharmacyService.api.post('/pharmacy/report-schedules', form);
      if (res.data?.success) {
        toast.success('Schedule saved!');
        onSaved();
        onClose();
      }
    } catch {
      toast.error('Failed to save schedule');
    }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title={
        <div>
          <div className="text-sm font-bold text-blue-800 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Schedule Report Delivery
          </div>
          <div className="text-xs text-blue-600 mt-0.5">{report.name}</div>
        </div>
      }
      maxWidth="sm:max-w-lg"
      footer={
        <div className="flex w-full gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2">
            <Bell className="w-4 h-4" /> Save Schedule
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Schedule Name</label>
          <input className={INPUT_CLS} value={form.scheduleName} onChange={f('scheduleName')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Frequency</label>
            <select className={INPUT_CLS} value={form.frequency} onChange={f('frequency')}>
              {['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'CUSTOM'].map(v => (
                <option key={v} value={v}>{v.charAt(0) + v.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Delivery Time</label>
            <input type="time" className={INPUT_CLS} value={form.deliveryTime} onChange={f('deliveryTime')} />
          </div>
        </div>

        {form.frequency === 'CUSTOM' && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CRON Expression</label>
            <input className={`${INPUT_CLS} font-mono`} value={form.reportParams} onChange={f('reportParams')} placeholder="0 8 * * MON-FRI" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Delivery Channel</label>
            <select className={INPUT_CLS} value={form.channels} onChange={f('channels')}>
              <option value="EMAIL">Email only</option>
              <option value="WHATSAPP">WhatsApp only</option>
              <option value="BOTH">Email + WhatsApp</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">File Format</label>
            <select className={INPUT_CLS} value={form.fileFormats} onChange={f('fileFormats')}>
              <option value="PDF">PDF only</option>
              <option value="EXCEL">Excel only</option>
              <option value="BOTH">PDF + Excel</option>
            </select>
          </div>
        </div>

        {(form.channels === 'EMAIL' || form.channels === 'BOTH') && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Recipients (comma-separated)</label>
            <input className={INPUT_CLS} value={form.emailRecipients} onChange={f('emailRecipients')} placeholder="admin@pharmacy.com, accounts@pharmacy.com" />
          </div>
        )}

        {(form.channels === 'WHATSAPP' || form.channels === 'BOTH') && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Numbers (comma-separated)</label>
            <input className={INPUT_CLS} value={form.whatsappNumbers} onChange={f('whatsappNumbers')} placeholder="+919876543210, +919876543211" />
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <strong>Note:</strong> WhatsApp delivery sends a PDF attachment with a summary message. Failed deliveries auto-retry after 30 minutes.
        </div>
      </div>
    </AppModal>
  );
}

ScheduleDrawer.propTypes = {
  report:   PropTypes.shape({
    id:       PropTypes.string.isRequired,
    name:     PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
  }).isRequired,
  onClose:  PropTypes.func.isRequired,
  onSaved:  PropTypes.func.isRequired,
};
