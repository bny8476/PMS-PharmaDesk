import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useShallow } from 'zustand/react/shallow';
import { useLocation } from 'react-router-dom';
import { Search, CreditCard, Eye, Printer, CheckCircle } from 'lucide-react';
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

export default function MedicineCreditBills() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const { items: creditBillsList = [], isLoading: loading } = usePageData(
    'credit-bills',
    '/pharmacy/credit-bills'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [reference, setReference] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paymentMutation = useMutation({
    mutationFn: () => pharmacyService.addCreditPayment(selectedBill.id, paymentAmount, paymentMode, reference),
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      setIsModalOpen(false);
      queryClient.invalidateQueries(['credit-bills']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  });

  const handleRecordPayment = () => {
    if (!paymentAmount) {
      toast.error('Please enter amount');
      return;
    }
    paymentMutation.mutate();
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Bill No', render: (row) => row.bill.billNumber },
    { header: 'Patient Name', render: (row) => row.bill.patientName },
    { header: 'Bill Date', render: (row) => new Date(row.bill.billingDate).toLocaleDateString() },
    { header: 'Total Amount', render: (row) => `₹${row.totalAmount.toFixed(2)}` },
    { header: 'Paid Amount', render: (row) => `₹${row.paidAmount.toFixed(2)}` },
    { header: 'Balance', render: (row) => <span className="text-red-600 font-bold">₹{row.balanceAmount.toFixed(2)}</span> },
    { header: 'Status', render: (row) => {
      let variant = row.status === 'PAID' ? 'success' : row.status === 'PARTIAL' ? 'warning' : 'danger';
      return <Badge variant={variant}>{row.status}</Badge>;
    }},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button title="View" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
        {row.status !== 'PAID' && (
          <button 
            title="Collect Payment" 
            onClick={() => { setSelectedBill(row); setPaymentAmount(row.balanceAmount); setIsModalOpen(true); }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        )}
        <button title="Print" className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"><Printer className="w-4 h-4" /></button>
      </div>
    )}
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Credit Bills...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Medicine Credit Bills</h2>
        <p className="text-sm text-gray-500 font-medium">Track outstanding balances and manage credit settlements</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={(() => {
                const filtered = creditBillsList.filter(row => {
                  const searchLower = debouncedSearch.toLowerCase();
                  const matchesSearch = !debouncedSearch || 
                    row.bill?.billNumber?.toLowerCase().includes(searchLower) ||
                    row.bill?.patientName?.toLowerCase().includes(searchLower);
                  
                  const billDate = new Date(row.bill?.billingDate || new Date());
                  const matchesFrom = !dateRange.from || billDate >= dateRange.from;
                  const matchesTo = !dateRange.to || billDate <= dateRange.to;
                  
                  return matchesSearch && matchesFrom && matchesTo;
                });
                return pageSize === 'All' ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
              })()} 
              hover 
              striped 
            />
            <Pagination totalRecords={creditBillsList.filter(row => {
                  const searchLower = debouncedSearch.toLowerCase();
                  const matchesSearch = !debouncedSearch || 
                    row.bill?.billNumber?.toLowerCase().includes(searchLower) ||
                    row.bill?.patientName?.toLowerCase().includes(searchLower);
                  
                  const billDate = new Date(row.bill?.billingDate || new Date());
                  const matchesFrom = !dateRange.from || billDate >= dateRange.from;
                  const matchesTo = !dateRange.to || billDate <= dateRange.to;
                  
                  return matchesSearch && matchesFrom && matchesTo;
                }).length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Collect Credit Payment"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={handleRecordPayment} disabled={paymentMutation.isPending} className="flex-1 px-6 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-50">
               {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
             </button>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
                  <span>Bill Reference</span>
                  <span className="text-slate-900">{selectedBill.bill.billNumber}</span>
               </div>
               <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                  <span>Patient</span>
                  <span className="text-slate-900">{selectedBill.bill.patientName}</span>
               </div>
            </div>

            <div className="text-center py-4">
               <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Outstanding Balance</p>
               <p className="text-4xl font-black text-red-600 tracking-tighter">₹{selectedBill.balanceAmount.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Amount</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-lg font-bold outline-none focus:ring-2 focus:ring-success/20 transition-all" 
                    />
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₹</span>
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Mode</label>
                  <select 
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-success/20 transition-all font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CARD">Card Payment</option>
                  </select>
               </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
