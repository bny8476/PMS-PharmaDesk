import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ShieldAlert, RefreshCw, ClipboardList, CheckCircle2, Lock, Unlock, Search, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import pharmacyService from '../utils/pharmacyService';
import OTPVerificationModal from '../components/auth/OTPVerificationModal';

export default function Narcotics() {
  const [isVerified, setIsVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [selectedMedId, setSelectedMedId] = useState('');

  // Reconciliation form states
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [physicalCount, setPhysicalCount] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    // Open verification by default
    if (!isVerified) {
      setShowOtpModal(true);
    }
  }, [isVerified]);

  const { data: medicines = [] } = useQuery({
    queryKey: ['restricted-medicines'],
    queryFn: async () => {
      const res = await pharmacyService.getMedicines();
      return (res.data || res || []).filter(m => 
        ['Schedule X', 'Narcotic'].includes(m.schedule)
      );
    },
    enabled: isVerified
  });

  const { data: registerEntries = [], isLoading: loading } = useQuery({
    queryKey: ['narcotic-register', selectedMedId],
    queryFn: async () => {
      const from = '2026-01-01'; // Fetch all from year start
      const to = new Date().toISOString().split('T')[0];
      const res = await pharmacyService.getNarcoticRegister(selectedMedId, from, to);
      return res.data || res || [];
    },
    enabled: !!selectedMedId && isVerified
  });

  const { data: reconciliation = null } = useQuery({
    queryKey: ['narcotic-reconciliation', selectedMedId, month, year],
    queryFn: async () => {
      const res = await pharmacyService.getNarcoticMonthlyReconciliation(selectedMedId, month, year);
      return res.data || res || null;
    },
    enabled: !!selectedMedId && isVerified
  });

  const loadRegister = () => {
    queryClient.invalidateQueries(['narcotic-register', selectedMedId]);
    queryClient.invalidateQueries(['narcotic-reconciliation', selectedMedId, month, year]);
  };

  const reconcileMutation = useMutation({
    mutationFn: (payload) => pharmacyService.api.post('/pharmacy/narcotic-register/reconciliation', payload),
    onSuccess: (res) => {
      if (res.data?.success || res.data?.id) {
        toast.success('Monthly NDPS reconciliation locked successfully');
        setPhysicalCount('');
        setDiscrepancyReason('');
        loadRegister();
      }
    },
    onError: () => toast.error('Failed to submit monthly reconciliation')
  });

  const tableContainerRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: registerEntries?.length || 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!selectedMedId || !physicalCount) {
      toast.error('Please enter physical stock count');
      return;
    }
    
    const payload = {
      medicine: { id: parseInt(selectedMedId) },
      month: parseInt(month),
      year: parseInt(year),
      systemStock: reconciliation?.systemCount || 0,
      physicalCount: parseInt(physicalCount),
      discrepancyReason: discrepancyReason || ''
    };
    
    reconcileMutation.mutate(payload);
  };

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Lock className="w-12 h-12 text-purple-700 bg-purple-50 p-2.5 border border-purple-100 rounded-2xl" />
        <h3 className="text-base font-bold text-slate-800">Controlled Substance NDPS Access Gated</h3>
        <p className="text-xs text-slate-400 text-center max-w-sm">Access to Narcotic and Psychotropic registers requires verified two-factor authentication.</p>
        <button
          onClick={() => setShowOtpModal(true)}
          className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          Verify 2FA Credential
        </button>

        <OTPVerificationModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          onVerifySuccess={() => setIsVerified(true)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Narcotics & Psychotropic Register (NDPS)</h2>
          <p className="text-sm text-slate-400">Compliance records for Schedule X and controlled substance inventories.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5" /> Session Verified
          </span>
          <button onClick={loadRegister} disabled={loading} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Select Box */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Controlled Substance *</label>
        <select
          value={selectedMedId}
          onChange={e => setSelectedMedId(e.target.value)}
          className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
        >
          <option value="">Select narcotic medicine</option>
          {medicines.map(med => (
            <option key={med.id} value={med.id}>{med.name} ({med.schedule})</option>
          ))}
        </select>
      </div>

      {selectedMedId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Register log */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700">Audit Trail Ledger</h3>
            </div>
            <div ref={tableContainerRef} className="overflow-auto max-h-[500px] relative">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase bg-slate-50">Date</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase bg-slate-50">Ref / Batch</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase bg-slate-50">Action</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase bg-slate-50">In</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase bg-slate-50">Out</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase bg-slate-50">Closing</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase bg-slate-50">User</th>
                  </tr>
                </thead>
                <tbody>
                  {paddingTop > 0 && <tr><td style={{ height: `${paddingTop}px` }} colSpan="7" /></tr>}
                  {virtualItems.map(virtualRow => {
                    const entry = registerEntries[virtualRow.index];
                    return (
                      <tr key={entry.id || virtualRow.index} data-index={virtualRow.index} ref={rowVirtualizer.measureElement} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{entry.createdAt?.split('T')?.[0] || entry.transactionDate}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-700">{entry.referenceNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Bth: {entry.batchNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{entry.transactionType}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                          {entry.transactionType === 'INWARD' || entry.quantityIn > 0 ? `+${entry.quantityIn || entry.quantity}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 font-bold">
                          {entry.transactionType === 'OUTWARD' || entry.quantityOut > 0 ? `-${entry.quantityOut || entry.quantity}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{entry.closingBalance}</td>
                        <td className="px-4 py-3 text-slate-500">{entry.pharmacistName || entry.verifiedBy}</td>
                      </tr>
                    );
                  })}
                  {paddingBottom > 0 && <tr><td style={{ height: `${paddingBottom}px` }} colSpan="7" /></tr>}
                  {(!Array.isArray(registerEntries) || registerEntries.length === 0) && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">No logs in this audit trail.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reconciliation Side Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-700" /> Monthly Reconciliation
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Month</label>
                  <select
                    value={month}
                    onChange={e => setMonth(parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-700"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-700"
                  />
                </div>
              </div>

              {reconciliation ? (
                <div className="p-3 bg-purple-50 border border-purple-100 text-purple-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" /> Reconciliation Logged
                  </div>
                  <div>System Book Balance: <span className="font-bold">{reconciliation.systemStock || reconciliation.systemCount || 0} units</span></div>
                  <div>Physical Inventory: <span className="font-bold">{reconciliation.physicalCount} units</span></div>
                  {reconciliation.discrepancyReason && (
                    <div>Reason: <span className="italic text-[10px]">"{reconciliation.discrepancyReason}"</span></div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleReconcile} className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg text-xs">
                    Current system count will be matched against your physical verification count.
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Physical Verified Count *</label>
                    <input
                      type="number"
                      min="0"
                      value={physicalCount}
                      onChange={e => setPhysicalCount(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                      placeholder="Enter count"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Discrepancy Notes (If mismatch)</label>
                    <textarea
                      rows="3"
                      value={discrepancyReason}
                      onChange={e => setDiscrepancyReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 bg-white resize-none"
                      placeholder="e.g. Discharged patient excess returns..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reconcileMutation.isPending}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" /> Submit Audit Reconciliation
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
