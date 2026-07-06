import { create } from 'zustand';
import pharmacyService from '../utils/pharmacyService';
import { toast } from 'react-hot-toast';

export const useBillingStore = create((set) => ({
  // Credit Bills State
  creditBillsList: [],
  creditBillsLoading: false,

  fetchCreditBills: async () => {
    set({ creditBillsLoading: true });
    try {
      const response = await pharmacyService.getCreditBills();
      if (response && response.success) {
        set({ creditBillsList: Array.isArray(response.data) ? response.data : [], creditBillsLoading: false });
      } else {
        set({ creditBillsList: [], creditBillsLoading: false });
      }
    } catch (error) {
      console.error('Credit Bills Error:', error);
      set({ creditBillsList: [], creditBillsLoading: false });
    }
  },

  // Insurance Claims State
  claims: [],
  providers: [],
  claimsLoading: false,

  loadClaimsData: async () => {
    set({ claimsLoading: true });
    try {
      const cRes = await pharmacyService.getInsuranceClaims();
      const pRes = await pharmacyService.getInsuranceProviders();
      
      const getArray = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
        return [];
      };

      const rawClaims = getArray(cRes);
      const mappedClaims = rawClaims.map(c => ({
        ...c,
        id: c.claimId || c.id,
        status: c.claimStatus || c.status,
        policyNumber: c.insurancePolicyNumber || c.policyNumber,
        coPayAmount: c.nonCoveredAmount || c.coPayAmount
      }));

      set({
        claims: mappedClaims,
        providers: getArray(pRes),
        claimsLoading: false
      });
    } catch {
      toast.error('Failed to load insurance claims data');
      set({ claimsLoading: false });
    }
  },

  // Pharmacy Advances State
  advancesList: [],
  advancesLoading: false,

  fetchAdvances: async () => {
    set({ advancesLoading: true });
    try {
      const response = await pharmacyService.getAllAdvances();
      if (response && response.success) {
        set({ advancesList: Array.isArray(response.data) ? response.data : [], advancesLoading: false });
      } else {
        set({ advancesList: [], advancesLoading: false });
      }
    } catch (error) {
      console.error('Pharmacy Advances Error:', error);
      set({ advancesList: [], advancesLoading: false });
    }
  }
}));
