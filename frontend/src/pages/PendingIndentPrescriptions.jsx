import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useLocation } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Plus, Send, Search, Trash2, PlusCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

const mockIndents = [
  { id: 1, indentNo: 'IND-3301', dept: 'Cardiology', requestedBy: 'Staff Nurse Ravi', date: '16-Apr-2026', itemsCount: 15, status: 'Pending' },
  { id: 2, indentNo: 'IND-3295', dept: 'Emergency', requestedBy: 'Dr. Anita', date: '15-Apr-2026', itemsCount: 25, status: 'Partial' },
  { id: 3, indentNo: 'IND-3280', dept: 'General Ward', requestedBy: 'Nurse Meera', date: '14-Apr-2026', itemsCount: 8, status: 'Fulfilled' },
];

export default function PendingIndentPrescriptions() {
  const location = useLocation();
  const [indents, setIndents] = useState(mockIndents);

  useEffect(() => {
    // Re-fetch logic would go here if not using mocks
  }, [location.key]);

  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [isNewIndentModalOpen, setIsNewIndentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [indentToDelete, setIndentToDelete] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New Indent form state
  const [targetDept, setTargetDept] = useState('General Ward');
  const [requester, setRequester] = useState('');
  const [indentItems, setIndentItems] = useState([
     { id: Date.now(), name: '', qty: 1 }
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);

  const handleStockSearch = async (val, idx) => {
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

  const selectMedicine = (stock, idx) => {
    const newItems = [...indentItems];
    newItems[idx].name = stock.medicine?.name;
    setIndentItems(newItems);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const addRow = () => setIndentItems([...indentItems, { id: Date.now(), name: '', qty: 1 }]);
  
  const saveNewIndent = () => {
    if (!requester) { toast.error('Enter requester name'); return; }
    if (indentItems.some(i => !i.name)) { toast.error('Complete all medicine names'); return; }
    
    const newIndent = {
      id: Date.now(),
      indentNo: `IND-${3300 + indents.length + 1}`,
      dept: targetDept,
      requestedBy: requester,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      itemsCount: indentItems.length,
      status: 'Pending'
    };

    setIndents([newIndent, ...indents]);
    toast.success('Internal Indent created successfully!');
    setIsNewIndentModalOpen(false);
    
    // Reset
    setRequester('');
    setIndentItems([{ id: Date.now(), name: '', qty: 1 }]);
  };

  const confirmDelete = () => {
    if (indentToDelete) {
      setIndents(indents.filter(i => i.id !== indentToDelete));
      toast.success('Indent cancelled successfully');
      setIndentToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const filteredIndents = indents.filter(ind => {
    const s = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      ind.indentNo.toLowerCase().includes(s) ||
      ind.dept.toLowerCase().includes(s) ||
      ind.requestedBy.toLowerCase().includes(s);

    const indDate = new Date(ind.date);
    const normalizedIndDate = new Date(indDate.getFullYear(), indDate.getMonth(), indDate.getDate()).getTime();
    const matchesFrom = !dateRange.from || normalizedIndDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedIndDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

    return matchesSearch && matchesFrom && matchesTo;
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Indent No', accessor: 'indentNo' },
    { header: 'Department', accessor: 'dept' },
    { header: 'Requested By', accessor: 'requestedBy' },
    { header: 'Indent Date', render: (row) => row.date },
    { header: 'Items Count', accessor: 'itemsCount' },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Pending' ? 'danger' : row.status === 'Partial' ? 'warning' : 'success'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedIndent(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status !== 'Fulfilled' && (
          <button 
            title="Fulfill" 
            onClick={() => { setSelectedIndent(row); setIsFulfillModalOpen(true); }}
            className="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
        <button 
          title="Cancel" 
          onClick={() => { setIndentToDelete(row.id); setIsDeleteModalOpen(true); }}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Indent Prescription List</h2>
        <p className="text-sm text-gray-500 font-medium">Process bulk department indents and internal pharmacy requests</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[{ label: 'New Indent', icon: Plus, variant: 'primary', onClick: () => setIsNewIndentModalOpen(true) }]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={pageSize === 'All' ? filteredIndents : filteredIndents.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
        <Pagination totalRecords={filteredIndents.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      {/* Fulfill Modal */}
      <AppModal 
        isOpen={isFulfillModalOpen} 
        onClose={() => setIsFulfillModalOpen(false)}
        title="Fulfill Pharmacy Indent"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsFulfillModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={() => { 
                setIndents(indents.map(i => i.id === selectedIndent.id ? { ...i, status: 'Fulfilled' } : i));
                toast.success('Indent items issued successfully!'); 
                setIsFulfillModalOpen(false); 
             }} className="flex-1 px-8 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2 font-display">
                <CheckCircle className="w-4 h-4"/> Confirm Issue
             </button>
          </div>
        }
      >
        {selectedIndent && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department Indent</p>
                  <p className="text-sm font-bold text-slate-800">{selectedIndent.indentNo} | {selectedIndent.dept}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</p>
                  <p className="text-sm font-bold text-slate-800">{selectedIndent.requestedBy}</p>
               </div>
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
               <DataTable 
                 columns={[
                   { header: 'Medicine', render: () => <div className="font-bold text-slate-700">Amoxicillin 500mg</div> },
                   { header: <div className="text-center">Required</div>, render: () => <div className="text-center font-bold">100</div> },
                   { header: <div className="text-center w-32">Issue Qty</div>, render: () => <input type="number" defaultValue="100" className="w-full text-center border rounded-lg py-1 outline-none focus:border-success font-bold text-success" /> }
                 ]}
                 data={[{ id: 1 }]}
                 hover
               />
            </div>
          </div>
        )}
      </AppModal>

      {/* New Indent Modal */}
      <AppModal
        isOpen={isNewIndentModalOpen}
        onClose={() => setIsNewIndentModalOpen(false)}
        title="Create New Pharmacy Indent"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsNewIndentModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={saveNewIndent} className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-display">
                <PlusCircle className="w-4 h-4"/> Submit Request
             </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Department</label>
                <select 
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                >
                  <option>Cardiology</option>
                  <option>Emergency</option>
                  <option>General Ward</option>
                  <option>Operation Theater</option>
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requester Name</label>
                <input 
                  type="text" 
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  placeholder="Enter name..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 font-bold" 
                />
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Medicine Requirements</label>
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
                              const val = e.target.value;
                              const ni = [...indentItems];
                              ni[idx].name = val;
                              setIndentItems(ni);
                              handleStockSearch(val, idx);
                           }}
                           placeholder="Search medicine..." 
                           className="w-full bg-transparent outline-none font-bold placeholder:font-normal placeholder:text-slate-300" 
                          />
                          {activeSearchIdx === idx && item.name.length >= 2 && searchResults.length > 0 && (
                            <div className="absolute z-50 left-0 top-full mt-1 w-full bg-white shadow-2xl border border-blue-100 rounded-xl overflow-hidden">
                              {searchResults.map(s => (
                                <div key={s.id} onClick={() => selectMedicine(s, idx)} className="px-4 py-3 hover:bg-blue-600 hover:text-white cursor-pointer font-bold border-b last:border-0 transition-colors">{s.medicine?.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    },
                    {
                      header: <div className="text-center w-32">Req. Quantity</div>,
                      render: (item, idx) => (
                        <input 
                         type="number" 
                         value={item.qty}
                         onChange={(e) => {
                           const ni = [...indentItems];
                           ni[idx].qty = parseInt(e.target.value) || 0;
                           setIndentItems(ni);
                         }}
                         className="w-20 mx-auto block text-center border rounded-lg py-1 outline-none focus:border-primary font-bold" 
                        />
                      )
                    },
                    {
                      header: <div className="text-center w-12"></div>,
                      render: (item) => (
                        <div className="text-center">
                          <button onClick={() => setIndentItems(indentItems.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )
                    }
                  ]}
                  data={indentItems}
                  hover
                />

                <button onClick={addRow} className="w-full py-3 bg-slate-50 text-sky-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 border-t border-slate-100 border-dashed transition-all">+ Add Row</button>
             </div>
          </div>
        </div>
      </AppModal>

      {/* View Modal */}
      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View Indent Details"
        maxWidth="sm:max-w-2xl"
      >
        {selectedIndent && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indent Number</p>
                 <p className="text-sm font-bold text-slate-800">{selectedIndent.indentNo}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                 <p className="text-sm font-bold text-slate-800">{selectedIndent.date}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                 <p className="text-sm font-bold text-slate-800">{selectedIndent.dept}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</p>
                 <p className="text-sm font-bold text-slate-800">{selectedIndent.requestedBy}</p>
               </div>
            </div>
            <div className="p-10 text-center text-slate-400 italic text-sm">
                Itemized medicine list for this indent is currently being processed.
            </div>
          </div>
        )}
      </AppModal>

      {/* Delete Confirmation Modal */}
      <AppModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Cancellation"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-2 border rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">No, Keep</button>
            <button onClick={confirmDelete} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all font-display">Yes, Cancel Indent</button>
          </div>
        }
      >
        <div className="p-6 text-center">
           <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <p className="font-bold text-gray-900 mb-1 text-lg">Are you sure?</p>
           <p className="text-sm text-gray-500">This will permanently cancel the indent request. This action cannot be undone.</p>
        </div>
      </AppModal>
    </div>
  );
}
