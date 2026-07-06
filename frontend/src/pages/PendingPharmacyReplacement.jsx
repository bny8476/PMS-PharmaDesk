import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useLocation } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Plus, ClipboardList, Trash2, Search, PlusCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

const initialMockReplacements = [
  { id: 1, reqNo: 'REQ-4401', ward: 'General Ward - A', requestedBy: 'Nurse Meena', date: '16-Apr-2026', items: 12, status: 'Pending' },
  { id: 2, reqNo: 'REQ-4395', ward: 'ICU - 1', requestedBy: 'Nurse Sarah', date: '15-Apr-2026', items: 8, status: 'Approved' },
];

export default function PendingPharmacyReplacement() {
  const location = useLocation();
  const [replacements, setReplacements] = useState(initialMockReplacements);

  useEffect(() => {
    // Re-fetch logic would go here if not using mocks
  }, [location.key]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);

  // Filter and Search State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New Request Form State
  const [ward, setWard] = useState('General Ward - A');
  const [requester, setRequester] = useState('');
  const [requestItems, setRequestItems] = useState([
    { id: Date.now(), name: '', qty: 1, stock: 0 }
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);

  const handleMedicineSearch = async (val, idx) => {
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setActiveSearchIdx(idx);
    try {
      const response = await pharmacyService.searchStocks(val);
      setSearchResults(response?.data || response || []);
    } catch (e) { console.error(e); }
  };

  const selectMedicine = (item, idx) => {
    const newItems = [...requestItems];
    newItems[idx] = {
      ...newItems[idx],
      name: item.medicine?.name,
      stock: item.quantityAvailable
    };
    setRequestItems(newItems);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const addRow = () => setRequestItems([...requestItems, { id: Date.now(), name: '', qty: 1, stock: 0 }]);

  const saveRequest = () => {
    if (!requester) { toast.error('Please enter requester name'); return; }
    if (requestItems.some(i => !i.name)) { toast.error('Select medicines for all rows'); return; }

    const newReq = {
      id: Date.now(),
      reqNo: `REQ-${4400 + replacements.length + 1}`,
      ward: ward,
      requestedBy: requester,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: requestItems.length,
      status: 'Pending'
    };

    setReplacements([newReq, ...replacements]);
    toast.success('Replacement request submitted successfully!');
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setRequester('');
    setWard('General Ward - A');
    setRequestItems([{ id: Date.now(), name: '', qty: 1, stock: 0 }]);
  };

  const confirmDelete = () => {
    setReplacements(replacements.filter(r => r.id !== requestToDelete));
    toast.success('Request cancelled successfully');
    setIsDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Request No', accessor: 'reqNo' },
    { header: 'Ward/Department', accessor: 'ward' },
    { header: 'Requested By', accessor: 'requestedBy' },
    { header: 'Request Date', accessor: 'date' },
    { header: 'Items Count', accessor: 'items' },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Pending' ? 'warning' : 'success'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedReplacement(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'Pending' && (
          <>
            <button 
              title="Approve & Send" 
              onClick={() => {
                setReplacements(replacements.map(r => r.id === row.id ? { ...r, status: 'Approved' } : r));
                toast.success('Items approved and sent to ward');
              }}
              className="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button 
              title="Reject" 
              onClick={() => { setRequestToDelete(row.id); setIsDeleteModalOpen(true); }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}
  ];

  const filteredReplacements = replacements.filter(r => {
    const s = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      r.reqNo.toLowerCase().includes(s) || 
      r.ward.toLowerCase().includes(s) || 
      r.requestedBy.toLowerCase().includes(s);

    const reqDate = new Date(r.date);
    const normalizedReqDate = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate()).getTime();
    
    const matchesFrom = !dateRange.from || normalizedReqDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedReqDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

    return matchesSearch && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Replacement Request List</h2>
        <p className="text-sm text-gray-500 font-medium">Manage stock replacement requests from hospital wards and departments</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[{ label: 'New Request', icon: Plus, variant: 'primary', onClick: () => setIsModalOpen(true) }]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={pageSize === 'All' ? filteredReplacements : filteredReplacements.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
        <Pagination totalRecords={filteredReplacements.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      {/* New Request Modal */}
      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="New Replacement Request"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex gap-3 w-full">
             <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button onClick={saveRequest} className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-display">
                <PlusCircle className="w-4 h-4" /> Submit Request
             </button>
          </div>
        }
      >
        <div className="space-y-8">
           <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ward / Department</label>
                 <select value={ward} onChange={(e) => setWard(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 font-bold">
                    <option>General Ward - A</option>
                    <option>ICU - 1</option>
                    <option>Emergency Room</option>
                    <option>Operation Theater</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</label>
                 <input type="text" value={requester} onChange={(e) => setRequester(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" placeholder="Name of requester..." />
              </div>
           </div>

           <div className="space-y-4">
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <DataTable 
                  columns={[
                    {
                      header: 'Medicine Name',
                      render: (item, idx) => (
                        <div className="relative">
                           <input 
                            type="text" 
                            value={item.name}
                            onChange={(e) => {
                               const v = e.target.value;
                               const ni = [...requestItems];
                               ni[idx].name = v;
                               setRequestItems(ni);
                               handleMedicineSearch(v, idx);
                            }}
                            placeholder="Enter medicine..." 
                            className="w-full bg-transparent outline-none font-bold placeholder:font-normal placeholder:text-slate-300"
                           />
                           {activeSearchIdx === idx && item.name.length >= 2 && searchResults.length > 0 && (
                             <div className="absolute z-50 left-0 top-full mt-1 w-full bg-white shadow-2xl border border-blue-100 rounded-xl overflow-hidden">
                                {searchResults.map(s => (
                                  <div key={s.id} onClick={() => selectMedicine(s, idx)} className="px-4 py-3 hover:bg-primary hover:text-white cursor-pointer border-b last:border-0 group transition-all">
                                    <div className="font-bold group-hover:text-white">{s.medicine?.name}</div>
                                    <div className="text-[10px] opacity-70 group-hover:text-white/80">BATCH: {s.batchNumber} | STOCK: {s.quantityAvailable}</div>
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      )
                    },
                    {
                      header: <div className="text-center w-32">Req. Qty</div>,
                      render: (item, idx) => (
                        <input 
                          type="number" 
                          value={item.qty}
                          onChange={(e) => {
                            const ni = [...requestItems];
                            ni[idx].qty = parseInt(e.target.value) || 0;
                            setRequestItems(ni);
                          }}
                          className="w-20 mx-auto block text-center border rounded-lg py-1 outline-none focus:border-primary font-bold" 
                        />
                      )
                    },
                    {
                      header: <div className="text-right">Stock</div>,
                      render: (item) => <div className="text-right font-bold text-success">{item.stock}</div>
                    },
                    {
                      header: <div className="text-center w-12"></div>,
                      render: (item) => (
                        <div className="text-center">
                          <button onClick={() => setRequestItems(requestItems.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      )
                    }
                  ]}
                  data={requestItems}
                  hover
                  striped
                />
                <button onClick={addRow} className="w-full py-3 bg-slate-50 text-sky-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 border-t border-slate-100 transition-all">+ Add Medicine</button>
              </div>
           </div>
        </div>
      </AppModal>

      {/* View Modal */}
      <AppModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Replacement Request Details" maxWidth="sm:max-w-2xl">
         {selectedReplacement && (
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request Number</p>
                   <p className="text-sm font-bold text-slate-800">{selectedReplacement.reqNo}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                   <Badge variant={selectedReplacement.status === 'Pending' ? 'warning' : 'success'}>{selectedReplacement.status}</Badge>
                 </div>
                 <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</p>
                   <p className="text-sm font-bold text-slate-800">{selectedReplacement.requestedBy} ({selectedReplacement.ward})</p>
                 </div>
              </div>
              <div className="p-8 text-center text-slate-400 italic text-sm">
                 Detailed pharmacy items for this request are pending IMS inventory sync.
              </div>
           </div>
         )}
      </AppModal>

      {/* Delete/Cancel Confirmation Modal */}
      <AppModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Rejection" 
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-2 border rounded-xl text-sm font-bold text-slate-500 hover:bg-gray-50 transition-all font-display">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all font-display">Reject Request</button>
          </div>
        }
      >
        <div className="p-6 text-center">
           <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <p className="font-bold text-slate-900 mb-1 text-lg">Are you sure?</p>
           <p className="text-sm text-slate-500">This will reject the replacement request. This action cannot be undone.</p>
        </div>
      </AppModal>
    </div>
  );
}
