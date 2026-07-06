import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useLocation } from 'react-router-dom';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

export default function ReturnWorklists() {
  const location = useLocation();
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(''); // 'Approve' or 'Reject'
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchPendingReturns();
  }, [location.key]);

  const fetchPendingReturns = async () => {
    try {
      const response = await pharmacyService.getPendingReturns();
      if (response.success) {
        setReturnRequests(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch return requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      const response = actionType === 'Approve' 
        ? await pharmacyService.approveReturn(selectedItem.id)
        : await pharmacyService.rejectReturn(selectedItem.id);
      
      if (response.success) {
        toast.success(`Return ${actionType}d successfully!`);
        setIsModalOpen(false);
        fetchPendingReturns();
      }
    } catch (error) {
      toast.error(`Failed to ${actionType.toLowerCase()} return`);
    }
  };

  const filteredRequests = returnRequests.filter(row => {
    const searchLower = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      row.id?.toString().includes(searchLower) ||
      row.originalBill?.billNumber?.toLowerCase().includes(searchLower) ||
      row.originalBill?.patientName?.toLowerCase().includes(searchLower);
    
    const retDate = new Date(row.returnDate);
    const normalizedRetDate = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate()).getTime();
    
    const matchesFrom = !dateRange.from || normalizedRetDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedRetDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();
    
    return matchesSearch && matchesFrom && matchesTo;
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Return No', render: (row) => `RET-${row.id}` },
    { header: 'Bill No', render: (row) => row.originalBill?.billNumber || 'N/A' },
    { header: 'Patient Name', render: (row) => row.originalBill?.patientName || 'N/A' },
    { header: 'Request Date', render: (row) => new Date(row.returnDate).toLocaleDateString('en-IN') },
    { header: 'Return Amount', render: (row) => `₹${Number(row.totalReturnAmount || 0).toFixed(2)}` },
    { header: 'Status', render: (row) => {
      let variant = row.status === 'PENDING' ? 'warning' : row.status === 'APPROVED' ? 'success' : 'danger';
      return <Badge variant={variant}>{row.status}</Badge>;
    }},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View Details" 
          onClick={() => { setSelectedItem(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'PENDING' && (
          <>
            <button 
              title="Approve" 
              onClick={() => { setSelectedItem(row); setActionType('Approve'); setIsModalOpen(true); }}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button 
              title="Reject" 
              onClick={() => { setSelectedItem(row); setActionType('Reject'); setIsModalOpen(true); }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold italic">Loading Return Worklist...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Return Approval Worklist</h2>
        <p className="text-sm text-gray-500 font-medium">Review and process return requests from various departments</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={pageSize === 'All' ? filteredRequests : filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
        <Pagination totalRecords={filteredRequests.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`${actionType} Return Request`}
        maxWidth="sm:max-w-lg"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button 
               onClick={handleAction}
               className={`flex-1 px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg ${actionType === 'Approve' ? 'bg-green-600 shadow-green-200 hover:bg-green-700' : 'bg-red-600 shadow-red-200 hover:bg-red-700'}`}
             >
                Confirm {actionType}
             </button>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Return ID</p>
                  <p className="text-sm font-bold text-slate-800">RET-{selectedItem.id}</p>
               </div>
               <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                  <p className="text-sm font-bold text-red-600">₹{Number(selectedItem.totalReturnAmount || 0).toFixed(2)}</p>
               </div>
               <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</p>
                  <p className="text-sm font-bold text-slate-800">{selectedItem.originalBill?.patientName || 'N/A'}</p>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Approval/Rejection Remarks</label>
               <textarea className="w-full h-24 p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white resize-none text-sm" placeholder="Enter reason or comments..."></textarea>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Return Request Details"
        maxWidth="sm:max-w-2xl"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium">Return ID</p>
                <p className="font-bold">RET-{selectedItem.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Original Bill</p>
                <p className="font-bold">{selectedItem.originalBill?.billNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Patient</p>
                <p className="font-bold">{selectedItem.originalBill?.patientName || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Amount</p>
                <p className="font-bold">₹{Number(selectedItem.totalReturnAmount || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="p-10 text-center text-slate-400 italic">
               Itemized return list and audit logs are available for review.
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
