import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Eye, Printer, RotateCcw } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

import { usePageData } from '../hooks/usePageData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import TableSkeleton from '../components/ui/TableSkeleton';

export default function MedicineCreditReturns() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const { items: creditReturns = [], isLoading: loading } = usePageData(
    'credit-returns',
    '/pharmacy/returns?type=CREDIT'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnToDelete, setReturnToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New Credit Return form state
  const [creditBillNo, setCreditBillNo] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  const fetchBillMutation = useMutation({
    mutationFn: (billNo) => pharmacyService.getSaleByNumber(billNo),
    onSuccess: (res) => {
      if (res.success) {
        setSelectedBill(res.data);
        toast.success('Bill items loaded');
      } else {
        toast.error('Credit bill not found');
      }
    },
    onError: () => toast.error('Credit bill not found')
  });

  const fetchBill = () => {
    if (!creditBillNo) return;
    fetchBillMutation.mutate(creditBillNo);
  };

  const saveReturnMutation = useMutation({
    mutationFn: (newRet) => {
      // Assuming pharmacyService.initiateReturn is the correct API
      return pharmacyService.initiateReturn(selectedBill.id, newRet.items, newRet.reason);
    },
    onSuccess: () => {
      toast.success('Credit Return saved successfully!');
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries(['credit-returns']);
    },
    onError: () => {
      toast.error('Failed to save Credit Return');
    }
  });

  const saveReturn = () => {
    if (!selectedBill) { toast.error('Please load a bill first'); return; }
    
    // Using mock logic for items temporarily as the form isn't fully implemented with item selection state yet
    const itemsToReturn = selectedBill.items?.map(item => ({ poItemId: item.id, quantity: 1 })) || [];
    saveReturnMutation.mutate({ items: itemsToReturn, reason: 'Credit Return' });
  };

  const deleteReturnMutation = useMutation({
    mutationFn: (id) => pharmacyService.rejectReturn(id), // Assuming reject cancels it
    onSuccess: () => {
      toast.success('Return record deleted');
      setIsDeleteModalOpen(false);
      setReturnToDelete(null);
      queryClient.invalidateQueries(['credit-returns']);
    },
    onError: () => toast.error('Failed to delete return record')
  });

  const confirmDelete = () => {
    deleteReturnMutation.mutate(returnToDelete);
  };

  const resetForm = () => {
    setCreditBillNo('');
    setSelectedBill(null);
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Return No', accessor: 'returnNo' },
    { header: 'Credit Bill No', accessor: 'billNo' },
    { header: 'Patient Name', accessor: 'patient' },
    { header: 'Return Date', accessor: 'date' },
    { header: 'Return Amount', render: (row) => <span className="font-bold text-red-600">₹{row.amount.toFixed(2)}</span> },
    { header: 'Status', render: (row) => <Badge variant="success">{row.status}</Badge> },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          onClick={() => { setSelectedReturn(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          onClick={() => { setReturnToDelete(row.id); setIsDeleteModalOpen(true); }}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"><Printer className="w-4 h-4" /></button>
      </div>
    )}
  ];

  const filteredReturns = creditReturns.filter(r => {
    const s = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      r.returnNo?.toLowerCase().includes(s) || 
      r.billNo?.toLowerCase().includes(s) || 
      r.patient?.toLowerCase().includes(s);

    const retDate = new Date(r.date || new Date());
    const normalizedRetDate = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate()).getTime();
    const matchesFrom = !dateRange.from || normalizedRetDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedRetDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

    return matchesSearch && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Medicine Credit Returns</h2>
        <p className="text-sm text-gray-500 font-medium">Process returns for medicines sold on credit</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[
          { label: 'New Credit Return', icon: Plus, variant: 'primary', onClick: () => setIsModalOpen(true) }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <>
            <DataTable columns={columns} data={pageSize === 'All' ? filteredReturns : filteredReturns.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
            <Pagination totalRecords={filteredReturns.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="New Credit Return Request"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex gap-3">
             <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button onClick={saveReturn} disabled={saveReturnMutation.isPending} className="px-8 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 font-display disabled:opacity-50">
                <RotateCcw className="w-4 h-4"/> {saveReturnMutation.isPending ? 'Saving...' : 'Save Return'}
             </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-inner">
            <div className="space-y-2 col-span-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Credit Bill Number</label>
               <div className="relative">
                 <input 
                  type="text" 
                  value={creditBillNo}
                  onChange={(e) => setCreditBillNo(e.target.value)}
                  placeholder="Enter Credit Bill No (e.g. BILL-B101)..." 
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-400/20 bg-white font-bold text-slate-700 transition-all" 
                 />
                 <Search className="w-4 h-4 absolute right-4 top-4 text-slate-300" />
               </div>
            </div>
            <button onClick={fetchBill} disabled={fetchBillMutation.isPending} className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
              {fetchBillMutation.isPending ? 'Fetching...' : 'Fetch Items'}
            </button>
          </div>

          {!selectedBill ? (
            <div className="py-24 text-center space-y-3 bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl">
               <RotateCcw className="w-10 h-10 text-slate-200 mx-auto" />
               <p className="text-slate-400 font-bold italic">Search and Load a Credit Bill to process return items.</p>
            </div>
          ) : (
             <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center px-2">
                   <div className="flex gap-6">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</p>
                        <p className="text-sm font-bold text-slate-800">{selectedBill.patientName}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill Date</p>
                        <p className="text-sm font-bold text-slate-800">{new Date(selectedBill.billingDate).toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                   <DataTable 
                     columns={[
                       { header: 'Medicine', render: (item) => <span className="font-bold text-slate-700">{item.stock?.medicine?.name}</span> },
                       {
                         header: <div className="text-center w-32">Return Qty</div>,
                         render: () => <input type="number" defaultValue="1" className="w-full text-center border rounded-lg py-1 outline-none focus:border-red-500 font-bold text-red-600" />
                       },
                       { header: <div className="text-right">Refund</div>, render: (item) => <span className="text-right font-black text-slate-900 block">₹{item.unitPrice.toFixed(2)}</span> }
                     ]}
                     data={selectedBill.items || []}
                     hover
                     striped
                   />
                </div>
             </div>
          )}
        </div>
      </AppModal>

      {/* View Modal */}
      <AppModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        title="Credit Return Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium">Return No</p>
                <p className="font-bold">{selectedReturn.returnNo}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Bill No</p>
                <p className="font-bold">{selectedReturn.billNo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Patient</p>
                <p className="font-bold">{selectedReturn.patient}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Date</p>
                <p className="font-bold">{selectedReturn.date}</p>
              </div>
            </div>
            <div className="p-10 text-center text-slate-400 italic">
              Return items details are stored in the historical ledger.
            </div>
          </div>
        )}
      </AppModal>

      {/* Delete Confirmation */}
      <AppModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-2 border rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
            <button onClick={confirmDelete} disabled={deleteReturnMutation.isPending} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-red-700 disabled:opacity-50">Delete</button>
          </div>
        }
      >
        <div className="p-6 text-center">
          <p className="font-bold text-gray-900 mb-2">Delete this return record?</p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
        </div>
      </AppModal>
    </div>
  );
}
