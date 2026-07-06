import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Eye, Printer, Layers, Trash2 } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';

const initialMockConsolidated = [
  { id: 1, cBillNo: 'CB-9901', patient: 'Aadhya Sharma', uhid: 'UHID-2910', date: '16-Apr-2026', billsMerged: 4, total: 3450.00, status: 'Settled' },
  { id: 2, cBillNo: 'CB-9852', patient: 'Karan Mehra', uhid: 'UHID-4421', date: '12-Apr-2026', billsMerged: 2, total: 1200.00, status: 'Settled' },
];

export default function ConsolidatedBills() {
  const location = useLocation();
  const [consolidatedList, setConsolidatedList] = useState(initialMockConsolidated);

  useEffect(() => {
    // Re-fetch logic would go here if not using mocks
  }, [location.key]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedConsolidated, setSelectedConsolidated] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Merge State
  const [patientSearch, setPatientSearch] = useState('');
  const [pendingBills, setPendingBills] = useState([
    { id: 'PH-45091', date: '16-Apr-2026', amount: 850.00, selected: false },
    { id: 'PH-45095', date: '16-Apr-2026', amount: 1200.00, selected: false },
    { id: 'PH-45102', date: '16-Apr-2026', amount: 450.00, selected: false },
  ]);

  const toggleBillSelection = (id) => {
    setPendingBills(pendingBills.map(b => b.id === id ? { ...b, selected: !b.selected } : b));
  };

  const calculateSelectedTotal = () => {
    return pendingBills
      .filter(b => b.selected)
      .reduce((acc, b) => acc + b.amount, 0);
  };

  const handleCreateConsolidated = () => {
    const selectedCount = pendingBills.filter(b => b.selected).length;
    if (selectedCount < 2) {
      toast.error('Please select at least 2 bills to merge');
      return;
    }
    if (!patientSearch) {
      toast.error('Please enter patient name');
      return;
    }

    const newCBill = {
      id: consolidatedList.length + 1,
      cBillNo: `CB-${9900 + consolidatedList.length + 1}`,
      patient: patientSearch,
      uhid: 'UHID-AUTO',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      billsMerged: selectedCount,
      total: calculateSelectedTotal(),
      status: 'Settled'
    };

    setConsolidatedList([newCBill, ...consolidatedList]);
    
    // Remove the merged bills from pending list
    setPendingBills(pendingBills.filter(b => !b.selected));
    
    toast.success('Consolidated Bill created successfully!');
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setPatientSearch('');
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Consolidated Bill No', accessor: 'cBillNo' },
    { header: 'Patient Name', accessor: 'patient' },
    { header: 'UHID', accessor: 'uhid' },
    { header: 'Bill Date', accessor: 'date' },
    { header: 'No. of Bills Merged', accessor: 'billsMerged' },
    { header: 'Total Amount', render: (row) => <span className="font-bold">₹{row.total.toFixed(2)}</span> },
    { header: 'Status', render: (row) => <Badge variant="success">{row.status}</Badge> },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedConsolidated(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          title="Print" 
          onClick={() => toast.success('Printing Consolidated Invoice...')}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  const filteredConsolidated = consolidatedList.filter(cb => {
    const s = debouncedSearch.toLowerCase();
    return !debouncedSearch || 
      cb.cBillNo.toLowerCase().includes(s) || 
      cb.patient.toLowerCase().includes(s) || 
      cb.uhid.toLowerCase().includes(s);
  });

  const paginatedConsolidated = pageSize === 'All' ? filteredConsolidated : filteredConsolidated.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Consolidated Bills</h2>
        <p className="text-sm text-gray-500 font-medium">Merge multiple pharmacy bills into a single consolidated invoice</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[
          { label: 'Create Consolidated Bill', icon: Plus, variant: 'primary', onClick: () => setIsModalOpen(true) }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={paginatedConsolidated} hover striped />
        <Pagination totalRecords={filteredConsolidated.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Merge Pending Bills"
        maxWidth="sm:max-w-3xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all flex-1">Cancel</button>
             <button onClick={handleCreateConsolidated} className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 flex-[2]">
                <Layers className="w-4 h-4"/> Create Consolidated Bill
             </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1.5 p-6 bg-slate-50 rounded-2xl border border-slate-100">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Patient</label>
             <div className="relative">
               <input 
                type="text" 
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search Patient (e.g. Aadhya)..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold" 
               />
               <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Layers className="w-4 h-4 text-primary" /> Pending Bills for Merge
             </h4>
             <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <DataTable 
                   columns={[
                      { 
                         header: (
                            <input 
                              type="checkbox" 
                              className="rounded"
                              onChange={(e) => setPendingBills(pendingBills.map(b => ({ ...b, selected: e.target.checked })))}
                              checked={pendingBills.length > 0 && pendingBills.every(b => b.selected)}
                            />
                         ),
                         render: (bill) => (
                            <input 
                              type="checkbox" 
                              checked={bill.selected}
                              onChange={() => {}} // Handled by row click
                              className="rounded text-primary" 
                            />
                         )
                      },
                      { header: 'Bill No', accessor: 'id', render: (bill) => <span className="font-bold text-primary">{bill.id}</span> },
                      { header: 'Date', accessor: 'date', render: (bill) => <span className="text-slate-500 font-medium">{bill.date}</span> },
                      { header: 'Amount', accessor: 'amount', render: (bill) => <span className="font-black text-slate-700">₹{bill.amount.toFixed(2)}</span> }
                   ]}
                   data={pendingBills}
                   onRowClick={(row) => toggleBillSelection(row.id)}
                   hover
                   striped
                />
             </div>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl flex justify-between items-center px-8 shadow-xl">
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Mergeable Amount</p>
             <p className="text-2xl font-black text-blue-400 animate-in fade-in zoom-in duration-300">₹{calculateSelectedTotal().toFixed(2)}</p>
          </div>
        </div>
      </AppModal>

      {/* View Modal */}
      <AppModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Consolidated Bill Details" maxWidth="sm:max-w-2xl">
         {selectedConsolidated && (
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">C-Bill Number</p>
                   <p className="text-sm font-bold text-slate-800">{selectedConsolidated.cBillNo}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                   <p className="text-sm font-black text-primary">₹{selectedConsolidated.total.toFixed(2)}</p>
                 </div>
                 <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</p>
                   <p className="text-sm font-bold text-slate-800">{selectedConsolidated.patient} ({selectedConsolidated.uhid})</p>
                 </div>
              </div>
              <div className="p-8 text-center text-slate-400 italic text-sm">
                 Itemized breakdown for consolidated bills is being retrieved from the billing server...
              </div>
           </div>
         )}
      </AppModal>
    </div>
  );
}
