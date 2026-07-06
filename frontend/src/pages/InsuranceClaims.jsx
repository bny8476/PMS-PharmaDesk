import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, RefreshCw, CheckCircle, Clock, XCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import AppModal from '../components/ui/AppModal';

export default function InsuranceClaims() {
  const queryClient = useQueryClient();

  const { data: rawClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['insurance-claims'],
    queryFn: async () => {
      const res = await pharmacyService.getInsuranceClaims();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const claims = rawClaims;

  const { data: rawProviders = [], isLoading: providersLoading } = useQuery({
    queryKey: ['insurance-providers'],
    queryFn: async () => {
      const res = await pharmacyService.getInsuranceProviders();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const providers = rawProviders;
  const loading = claimsLoading || providersLoading;

  // New claim form state
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [newClaim, setNewClaim] = useState({
    insuranceProviderName: '',
    policyNumber: '',
    claimReferenceNumber: '',
    patientName: '',
    totalBillAmount: '',
    coPayAmount: '',
    claimedAmount: '',
    preAuthApproved: false,
    remarks: ''
  });

  const createClaimMutation = useMutation({
    mutationFn: async (newClaim) => {
      let providerId = null;
      const existingProvider = providers.find(p => (p.providerName || p.name || '').toLowerCase() === newClaim.insuranceProviderName.toLowerCase());
      
      if (existingProvider) {
        providerId = existingProvider.providerId || existingProvider.id;
      } else {
        const newProviderRes = await pharmacyService.createInsuranceProvider({
          providerName: newClaim.insuranceProviderName,
          providerCode: newClaim.insuranceProviderName.substring(0, 5).toUpperCase() + Math.floor(Math.random() * 1000),
          providerType: 'TPA',
          claimSubmissionMode: 'ONLINE'
        });
        const createdData = newProviderRes.data || newProviderRes;
        providerId = createdData.providerId || createdData.id;
      }

      return await pharmacyService.createInsuranceClaim({
        provider: { providerId: providerId },
        insurancePolicyNumber: newClaim.policyNumber,
        patientName: newClaim.patientName,
        totalBillAmount: parseFloat(newClaim.totalBillAmount),
        nonCoveredAmount: parseFloat(newClaim.coPayAmount || 0),
        claimedAmount: parseFloat(newClaim.claimedAmount),
        claimStatus: 'SUBMITTED',
        rejectionReason: newClaim.remarks
      });
    },
    onSuccess: () => {
      toast.success('Insurance claim filed successfully');
      setShowClaimForm(false);
      setNewClaim({
        insuranceProviderName: '',
        policyNumber: '',
        claimReferenceNumber: '',
        patientName: '',
        totalBillAmount: '',
        coPayAmount: '',
        claimedAmount: '',
        preAuthApproved: false,
        remarks: ''
      });
      queryClient.invalidateQueries(['insurance-claims']);
      queryClient.invalidateQueries(['insurance-providers']);
    },
    onError: () => {
      toast.error('Error filing insurance claim');
    }
  });

  const handleCreateClaim = (e) => {
    e.preventDefault();
    if (!newClaim.insuranceProviderName || !newClaim.patientName || !newClaim.totalBillAmount || !newClaim.claimedAmount) {
      toast.error('Please enter all required fields');
      return;
    }
    createClaimMutation.mutate(newClaim);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => pharmacyService.updateInsuranceClaimStatus(id, status),
    onSuccess: (res, variables) => {
      toast.success(`Claim status updated to ${variables.status}`);
      queryClient.invalidateQueries(['insurance-claims']);
    },
    onError: () => {
      toast.error('Failed to update claim status');
    }
  });

  const handleUpdateStatus = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">REJECTED</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">SUBMITTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Insurance & TPA Claims</h2>
          <p className="text-sm text-slate-400">File patient insurance claims, track third party administrator approvals, and reconcile payments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowClaimForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> File Insurance Claim
          </button>
          <button onClick={() => {
            queryClient.invalidateQueries(['insurance-claims']);
            queryClient.invalidateQueries(['insurance-providers']);
          }} disabled={loading} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Claims</span>
          <span className="text-2xl font-black text-slate-800 mt-1">{claims.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Claimed Amount</span>
          <span className="text-2xl font-black text-blue-600 mt-1">₹{claims.reduce((sum, c) => sum + (c.claimedAmount || 0), 0).toFixed(2)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Approved Amount</span>
          <span className="text-2xl font-black text-emerald-600 mt-1">₹{claims.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + (c.claimedAmount || 0), 0).toFixed(2)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Count</span>
          <span className="text-2xl font-black text-amber-600 mt-1">{claims.filter(c => c.status === 'SUBMITTED' || c.status === 'PENDING').length}</span>
        </div>
      </div>

      {/* Claims Grid Ledger */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">Insurance Claims Ledger</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase">Patient Name</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase">Provider / Policy</th>
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase">Total Bill</th>
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase">Co-Pay</th>
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase">Claimed</th>
                <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase">Pre-Auth</th>
                <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{claim.patientName}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700 font-medium">{claim.insuranceProviderName || claim.insuranceProvider?.name || claim.provider?.providerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Pol: {claim.policyNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 font-mono">₹{claim.totalBillAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-500 font-mono">₹{claim.coPayAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700 font-mono">₹{claim.claimedAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {claim.preAuthApproved ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100">YES</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-400 text-[9px] font-bold border border-slate-100">NO</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(claim.status)}</td>
                  <td className="px-4 py-3 text-right flex gap-1 justify-end">
                    {claim.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(claim.id, 'APPROVED')}
                          className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
                          title="Approve Claim"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(claim.id, 'REJECTED')}
                          className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                          title="Reject Claim"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">No insurance claims filed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Form Modal */}
      <AppModal
        isOpen={showClaimForm}
        onClose={() => setShowClaimForm(false)}
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-base font-bold text-slate-800">File Insurance Claim Entry</span>
          </div>
        }
        maxWidth="sm:max-w-lg"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <button
              type="button"
              onClick={() => setShowClaimForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateClaim}
              disabled={createClaimMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
            >
              File Claim
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Insurance Provider *</label>
              <input
                list="providers-list"
                value={newClaim.insuranceProviderName || ''}
                onChange={e => setNewClaim({ ...newClaim, insuranceProviderName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                placeholder="Type or select a provider..."
                required
              />
              <datalist id="providers-list">
                {providers.map(p => <option key={p.providerId || p.id} value={p.providerName || p.name} />)}
              </datalist>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Policy / Card Number *</label>
              <input
                type="text"
                value={newClaim.policyNumber}
                onChange={e => setNewClaim({ ...newClaim, policyNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="e.g. POL-12345"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Claim Ref / Auth Number</label>
              <input
                type="text"
                value={newClaim.claimReferenceNumber}
                onChange={e => setNewClaim({ ...newClaim, claimReferenceNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="e.g. AUTH-987"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Patient Name *</label>
              <input
                type="text"
                value={newClaim.patientName}
                onChange={e => setNewClaim({ ...newClaim, patientName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="Patient Name"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Invoice Value (₹) *</label>
              <input
                type="number"
                value={newClaim.totalBillAmount}
                onChange={e => setNewClaim({ ...newClaim, totalBillAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Co-Pay / Deductible (₹)</label>
              <input
                type="number"
                value={newClaim.coPayAmount}
                onChange={e => setNewClaim({ ...newClaim, coPayAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="0.00"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Net Claimed Amount (₹) *</label>
              <input
                type="number"
                value={newClaim.claimedAmount}
                onChange={e => setNewClaim({ ...newClaim, claimedAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="0.00"
                required
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="preAuthApproved"
                checked={newClaim.preAuthApproved}
                onChange={e => setNewClaim({ ...newClaim, preAuthApproved: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-200 rounded"
              />
              <label htmlFor="preAuthApproved" className="text-xs font-bold text-slate-600">Pre-Authorisation Approved by TPA</label>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Internal Notes</label>
              <textarea
                rows="3"
                value={newClaim.remarks}
                onChange={e => setNewClaim({ ...newClaim, remarks: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
                placeholder="Additional claims remarks..."
              />
            </div>
          </div>
        </form>
      </AppModal>
    </div>
  );
}
