import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useShallow } from 'zustand/react/shallow';
import {
  Plus, Search, Truck, Trash2, Edit3, Eye, FileText, Star, TrendingUp,
  Phone, MapPin, CreditCard, User, Building2, Shield, ChevronRight,
  CheckCircle2, AlertCircle, XCircle, Clock, Package, BarChart3, ArrowLeft,
  Banknote, Receipt, RotateCcw, Filter, X
} from 'lucide-react';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useSupplierStore } from '../store/useSupplierStore';
import GRNEntry from './GRNEntry';
import InvoiceMatching from './InvoiceMatching';
import SupplierReturns from './SupplierReturns';
import { usePageData } from '../hooks/usePageData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import pharmacyService from '../utils/pharmacyService';

// ── Status helpers ──────────────────────────────────────────────
const statusConfig = {
  ACTIVE:      { label: 'Active',      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  INACTIVE:    { label: 'Inactive',    cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  BLACKLISTED: { label: 'Blacklisted', cls: 'bg-red-50 text-red-700 border border-red-200' },
};

const typeColors = {
  MANUFACTURER: 'bg-violet-50 text-violet-700 border border-violet-200',
  DISTRIBUTOR:  'bg-blue-50 text-blue-700 border border-blue-200',
  WHOLESALER:   'bg-cyan-50 text-cyan-700 border border-cyan-200',
  IMPORTER:     'bg-orange-50 text-orange-700 border border-orange-200',
};

const scoreColor = (s) => {
  if (!s && s !== 0) return { text: 'text-slate-400', ring: '#e2e8f0', fill: '#94a3b8', label: 'N/A' };
  if (s >= 80) return { text: 'text-emerald-600', ring: '#d1fae5', fill: '#10b981', label: 'Preferred' };
  if (s >= 60) return { text: 'text-amber-600', ring: '#fef3c7', fill: '#f59e0b', label: 'Acceptable' };
  return { text: 'text-red-600', ring: '#fee2e2', fill: '#ef4444', label: 'At Risk' };
};

// ── Score Ring Component ────────────────────────────────────────
function ScoreRing({ score }) {
  const cfg = scoreColor(score);
  const r = 22, circ = 2 * Math.PI * r;
  const pct = score != null ? Math.min(100, Math.max(0, score)) / 100 : 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke={cfg.ring} strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={cfg.fill} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.5s' }} />
        <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill={cfg.fill}>
          {score != null ? Math.round(score) : '–'}
        </text>
      </svg>
      <span className={`text-[10px] font-bold ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

// ── Metric Row ──────────────────────────────────────────────────
function MetricBar({ label, value, max = 100, good = true }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = good ? (pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444')
                     : (pct <= 20 ? '#10b981' : pct <= 40 ? '#f59e0b' : '#ef4444');
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-slate-700">{value != null ? `${value.toFixed(1)}%` : 'N/A'}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Main Supplier Form Fields ───────────────────────────────────
const EMPTY_FORM = {
  name: '', supplierCode: '', supplierType: '', contactPersonName: '', designation: '',
  mobileNumber: '', alternatePhone: '', emailAddress: '', address: '', pincode: '',
  city: '', state: '', country: 'India', gstin: '', drugLicenseNumber: '',
  drugLicenseExpiry: '', panNumber: '', accountNumber: '', bankName: '',
  branch: '', ifscCode: '', paymentTerms: 'Net 30', creditLimit: '',
  preferredDeliveryDays: '', status: 'ACTIVE', notes: ''
};

const TAB_BASIC  = 'basic';
const TAB_LEGAL  = 'legal';
const TAB_BANK   = 'bank';
const TAB_TERMS  = 'terms';

function SupplierFormModal({ isOpen, onClose, isEditMode, initialData, onSave }) {
  const [tab, setTab] = useState(TAB_BASIC);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setForm(isEditMode && initialData ? {
      ...EMPTY_FORM,
      ...initialData,
      drugLicenseExpiry: initialData.drugLicenseExpiry || ''
    } : EMPTY_FORM);
    setTab(TAB_BASIC);
  }, [isEditMode, initialData, isOpen]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white";
  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1";

  const tabs = [
    { id: TAB_BASIC, label: 'Basic Info', icon: User },
    { id: TAB_LEGAL, label: 'Legal & Compliance', icon: Shield },
    { id: TAB_BANK,  label: 'Bank Details', icon: Banknote },
    { id: TAB_TERMS, label: 'Terms & Notes', icon: FileText },
  ];

  return (
    <AppModal isOpen={isOpen} onClose={onClose}
      title={isEditMode ? 'Edit Supplier' : 'Register New Supplier'}
      maxWidth="sm:max-w-3xl"
      footer={
        <div className="flex w-full gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">
            {isEditMode ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 mb-4 -mx-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}>
            <t.icon className="w-3 h-3" />{t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-1 min-h-[280px]">
        {tab === TAB_BASIC && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Supplier / Company Name *</label>
                <input className={inputCls} value={form.name} onChange={f('name')} placeholder="e.g. Acme Pharmaceuticals" />
              </div>
              <div>
                <label className={labelCls}>Supplier Type</label>
                <select className={inputCls} value={form.supplierType} onChange={f('supplierType')}>
                  <option value="">Select type</option>
                  {['MANUFACTURER','DISTRIBUTOR','WHOLESALER','IMPORTER'].map(t => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={f('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BLACKLISTED">Blacklisted</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Contact Person Name</label>
                <input className={inputCls} value={form.contactPersonName} onChange={f('contactPersonName')} placeholder="Mr. Ravi Kumar" />
              </div>
              <div>
                <label className={labelCls}>Designation</label>
                <input className={inputCls} value={form.designation} onChange={f('designation')} placeholder="Sales Manager" />
              </div>
              <div>
                <label className={labelCls}>Mobile Number</label>
                <input className={inputCls} value={form.mobileNumber} onChange={f('mobileNumber')} placeholder="+91 9876543210" />
              </div>
              <div>
                <label className={labelCls}>Alternate Phone</label>
                <input className={inputCls} value={form.alternatePhone} onChange={f('alternatePhone')} placeholder="+91 9876543211" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Email Address</label>
                <input className={inputCls} type="email" value={form.emailAddress} onChange={f('emailAddress')} placeholder="supplier@example.com" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Full Address</label>
                <textarea className={inputCls} rows={2} value={form.address} onChange={f('address')} placeholder="Street / Area / Locality" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} value={form.city} onChange={f('city')} placeholder="Chennai" />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input className={inputCls} value={form.state} onChange={f('state')} placeholder="Tamil Nadu" />
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input className={inputCls} value={form.pincode} onChange={f('pincode')} placeholder="600001" />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input className={inputCls} value={form.country} onChange={f('country')} placeholder="India" />
              </div>
            </div>
          </>
        )}

        {tab === TAB_LEGAL && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>GSTIN (15-digit)</label>
              <input className={`${inputCls} font-mono`} value={form.gstin} onChange={f('gstin')} placeholder="22AAAAA0000A1Z5" maxLength={15} />
            </div>
            <div>
              <label className={labelCls}>Drug License Number</label>
              <input className={inputCls} value={form.drugLicenseNumber} onChange={f('drugLicenseNumber')} placeholder="DL/2024/012345" />
            </div>
            <div>
              <label className={labelCls}>Drug License Expiry</label>
              <input className={inputCls} type="date" value={form.drugLicenseExpiry} onChange={f('drugLicenseExpiry')} />
            </div>
            <div>
              <label className={labelCls}>PAN Number</label>
              <input className={`${inputCls} font-mono uppercase`} value={form.panNumber} onChange={f('panNumber')} placeholder="AAAAA0000A" maxLength={10} />
            </div>
            <div>
              <label className={labelCls}>Supplier Code (auto-generated)</label>
              <input className={`${inputCls} bg-slate-50 text-slate-400`} value={form.supplierCode} readOnly placeholder="Auto-assigned on save" />
            </div>
          </div>
        )}

        {tab === TAB_BANK && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Account Number</label>
              <input className={`${inputCls} font-mono`} value={form.accountNumber} onChange={f('accountNumber')} placeholder="000123456789" />
            </div>
            <div>
              <label className={labelCls}>Bank Name</label>
              <input className={inputCls} value={form.bankName} onChange={f('bankName')} placeholder="State Bank of India" />
            </div>
            <div>
              <label className={labelCls}>Branch</label>
              <input className={inputCls} value={form.branch} onChange={f('branch')} placeholder="Anna Nagar, Chennai" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>IFSC Code</label>
              <input className={`${inputCls} font-mono uppercase`} value={form.ifscCode} onChange={f('ifscCode')} placeholder="SBIN0001234" maxLength={11} />
            </div>
          </div>
        )}

        {tab === TAB_TERMS && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Payment Terms</label>
              <select className={inputCls} value={form.paymentTerms} onChange={f('paymentTerms')}>
                {['Net 7','Net 15','Net 30','Net 45','Net 60','Advance','Custom'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Credit Limit (₹)</label>
              <input className={inputCls} type="number" value={form.creditLimit} onChange={f('creditLimit')} placeholder="500000" />
            </div>
            <div>
              <label className={labelCls}>Preferred Delivery Days</label>
              <input className={inputCls} value={form.preferredDeliveryDays} onChange={f('preferredDeliveryDays')} placeholder="Mon, Wed, Fri" />
            </div>
            <div />
            <div className="md:col-span-2">
              <label className={labelCls}>Internal Notes / Remarks</label>
              <textarea className={inputCls} rows={4} value={form.notes} onChange={f('notes')}
                placeholder="Special handling instructions, negotiation history, field rep details..." />
            </div>
          </div>
        )}
      </div>
    </AppModal>
  );
}

// ── SUPPLIER PROFILE PANEL (Drawer-style) ─────────────────────
function SupplierProfile({ supplier, onClose, onEdit, onCreatePO }) {
  const [performance, setPerformance] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (supplier?.id) {
      pharmacyService.getSupplierPerformance(supplier.id)
        .then(res => setPerformance(res.data || []))
        .catch(() => {});
    }
  }, [supplier?.id]);

  if (!supplier) return null;
  const sc = scoreColor(supplier.latestScore);
  const latestPerf = performance[0];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[700px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{supplier.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono">{supplier.supplierCode || 'N/A'}</span>
                {supplier.supplierType && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColors[supplier.supplierType] || 'bg-slate-100 text-slate-600'}`}>
                    {supplier.supplierType}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onCreatePO(supplier)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Create PO
            </button>
            <button onClick={() => onEdit(supplier)} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-100 px-5">
          {[['overview','Overview'],['legal','Legal'],['bank','Bank'],['performance','Performance']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all ${activeTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Contact Person', supplier.contactPersonName || supplier.contact || '—'],
                  ['Designation', supplier.designation || '—'],
                  ['Mobile', supplier.mobileNumber || '—'],
                  ['Email', supplier.emailAddress || '—'],
                  ['City', supplier.city || '—'],
                  ['State', supplier.state || '—'],
                  ['Payment Terms', supplier.paymentTerms || '—'],
                  ['Credit Limit', supplier.creditLimit ? `₹${Number(supplier.creditLimit).toLocaleString()}` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{k}</div>
                    <div className="text-sm font-bold text-slate-700 break-all">{v}</div>
                  </div>
                ))}
              </div>
              {supplier.address && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Address</div>
                  <div className="text-sm font-bold text-slate-700">{supplier.address}, {supplier.pincode}</div>
                </div>
              )}
              {supplier.notes && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Internal Notes</div>
                  <p className="text-xs text-amber-800">{supplier.notes}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'legal' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['GSTIN', supplier.gstin || '—'],
                ['PAN Number', supplier.panNumber || '—'],
                ['Drug License No.', supplier.drugLicenseNumber || '—'],
                ['Drug Lic. Expiry', supplier.drugLicenseExpiry || '—'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{k}</div>
                  <div className="text-sm font-mono font-bold text-slate-700">{v}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Account Number', supplier.accountNumber || '—'],
                ['Bank Name', supplier.bankName || '—'],
                ['Branch', supplier.branch || '—'],
                ['IFSC Code', supplier.ifscCode || '—'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{k}</div>
                  <div className="text-sm font-mono font-bold text-slate-700">{v}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              {latestPerf ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <div className="text-sm font-bold text-slate-700">Overall Score</div>
                      <div className="text-xs text-slate-400">Latest period</div>
                    </div>
                    <ScoreRing score={latestPerf.overallScore} />
                  </div>
                  <div className="space-y-3">
                    <MetricBar label="On-Time Delivery" value={latestPerf.onTimeDeliveryRate} />
                    <MetricBar label="Order Fill Rate" value={latestPerf.orderFillRate} />
                    <MetricBar label="Quality Rejection Rate" value={latestPerf.qualityRejectionRate} good={false} />
                    <MetricBar label="Invoice Accuracy" value={latestPerf.invoiceAccuracyRate} />
                    <MetricBar label="Return Rate" value={latestPerf.returnRate} good={false} />
                  </div>
                  {latestPerf.manualNotes && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                      <strong>Notes:</strong> {latestPerf.manualNotes}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">No performance data yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN SUPPLIERS PAGE

export default function Suppliers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { items: suppliers = [], isLoading: loading } = usePageData(
    'suppliers',
    '/pharmacy/suppliers'
  );

  const createSupplierMutation = useMutation({
    mutationFn: (data) => pharmacyService.createSupplier(data),
    onSuccess: () => {
      toast.success('Supplier created successfully');
      queryClient.invalidateQueries(['suppliers']);
    },
    onError: () => toast.error('Failed to create supplier')
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({id, data}) => pharmacyService.updateSupplier(id, data),
    onSuccess: () => {
      toast.success('Supplier updated successfully');
      queryClient.invalidateQueries(['suppliers']);
    },
    onError: () => toast.error('Failed to update supplier')
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id) => pharmacyService.deleteSupplier(id),
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries(['suppliers']);
    },
    onError: () => toast.error('Failed to delete supplier')
  });

  const [view, setView] = useState('list'); // list | grn | invoice | returns
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [profileSupplier, setProfileSupplier] = useState(null);

  const handleSave = async (form) => {
    if (!form.name?.trim()) { toast.error('Supplier name is required'); return; }
    
    if (isEditMode) {
      updateSupplierMutation.mutate(
        { id: selectedSupplier.id, data: form },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createSupplierMutation.mutate(
        form,
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    deleteSupplierMutation.mutate(id);
  };

  const openAdd = () => { setIsEditMode(false); setSelectedSupplier(null); setIsModalOpen(true); };
  const openEdit = (s) => { setIsEditMode(true); setSelectedSupplier(s); setIsModalOpen(true); setProfileSupplier(null); };

  const filtered = useMemo(() => {
    const list = suppliers || [];
    return list.filter(s => {
      const matchSearch = !debouncedSearch || 
        (s.name?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (s.supplierCode?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (s.gstin?.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
      const matchType = !filterType || s.supplierType === filterType;
      const matchStatus = !filterStatus || s.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [suppliers, searchTerm, filterType, filterStatus]);

  // Sub-view routing
  if (view === 'grn') return <GRNEntry onBack={() => setView('list')} />;
  if (view === 'invoice') return <InvoiceMatching onBack={() => setView('list')} />;
  if (view === 'returns') return <SupplierReturns onBack={() => setView('list')} />;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Suppliers & Procurement</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage suppliers, purchase orders, GRNs, and invoice matching</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Procurement Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Package, label: 'Goods Receipt (GRN)', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', action: () => setView('grn') },
          { icon: Receipt, label: 'Invoice Matching', color: 'bg-blue-50 border-blue-200 text-blue-700', action: () => setView('invoice') },
          { icon: RotateCcw, label: 'Returns to Supplier', color: 'bg-amber-50 border-amber-200 text-amber-700', action: () => setView('returns') },
          { icon: BarChart3, label: 'Performance Reports', color: 'bg-violet-50 border-violet-200 text-violet-700', action: () => toast('Reports coming soon') },
        ].map((card, i) => (
          <button key={i} onClick={card.action}
            className={`flex items-center gap-3 p-4 rounded-xl border ${card.color} hover:shadow-sm transition-all text-left group`}>
            <card.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold leading-tight">{card.label}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50 group-hover:opacity-100" />
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-slate-100 p-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, GSTIN, drug license…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none bg-white">
          <option value="">All Types</option>
          {['MANUFACTURER','DISTRIBUTOR','WHOLESALER','IMPORTER'].map(t => (
            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none bg-white">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BLACKLISTED">Blacklisted</option>
        </select>
        {(searchTerm || filterType || filterStatus) && (
          <button onClick={() => { setSearchTerm(''); setFilterType(''); setFilterStatus(''); }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {suppliers.length} suppliers</span>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            <p className="text-sm text-slate-400 font-bold">Loading suppliers…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No suppliers found</p>
            <p className="text-xs text-slate-300 mt-1">Add a supplier to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['#','Supplier','Type','Contact','GSTIN','Performance','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const statusCfg = statusConfig[s.status] || statusConfig.ACTIVE;
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Truck className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-700">{s.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.supplierCode || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.supplierType ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColors[s.supplierType] || 'bg-slate-100 text-slate-600'}`}>
                            {s.supplierType}
                          </span>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-600">{s.contactPersonName || s.contact || '—'}</div>
                        <div className="text-[10px] text-slate-400">{s.mobileNumber || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-slate-500">{s.gstin || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreRing score={s.latestScore} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button title="View Profile" onClick={() => setProfileSupplier(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button title="Create PO" onClick={() => {
                            window.location.href = '/purchase-orders';
                          }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button title="Edit" onClick={() => openEdit(s)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button title="Delete" onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditMode={isEditMode}
        initialData={selectedSupplier}
        onSave={handleSave}
      />

      {/* Profile Drawer */}
      {profileSupplier && (
        <SupplierProfile
          supplier={profileSupplier}
          onClose={() => setProfileSupplier(null)}
          onEdit={openEdit}
          onCreatePO={() => { setProfileSupplier(null); window.location.href = '/purchase-orders'; }}
        />
      )}
    </div>
  );
}
