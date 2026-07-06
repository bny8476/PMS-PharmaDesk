import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { Search, Eye, Printer, CheckCircle, FileCheck } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';

const mockClearance = [
  { id: 1, patient: 'Aadhya Sharma', uhid: 'UHID-2910', ward: 'General Ward - B2', admission: '10-Apr-2026', due: 12450.00, advance: 5000.00, net: 7450.00, status: 'Pending' },
  { id: 2, patient: 'Karan Mehra', uhid: 'UHID-4421', ward: 'ICU - 104', admission: '05-Apr-2026', due: 8500.00, advance: 8500.00, net: 0.00, status: 'Cleared' },
];

export default function PharmacyClearance() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);
  
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [clearanceList, setClearanceList] = useState(mockClearance);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredClearance = clearanceList.filter(row => {
    const s = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      row.patient.toLowerCase().includes(s) || 
      row.uhid.toLowerCase().includes(s) || 
      row.ward.toLowerCase().includes(s);

    const admDate = new Date(row.admission);
    const normalizedAdmDate = new Date(admDate.getFullYear(), admDate.getMonth(), admDate.getDate()).getTime();
    const matchesFrom = !dateRange.from || normalizedAdmDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedAdmDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

    return matchesSearch && matchesFrom && matchesTo;
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Patient Name', accessor: 'patient' },
    { header: 'UHID', accessor: 'uhid' },
    { header: 'Ward', accessor: 'ward' },
    { header: 'Admission Date', accessor: 'admission' },
    { header: 'Total Due', render: (row) => `₹${row.due.toFixed(2)}` },
    { header: 'Advance Adjusted', render: (row) => `₹${row.advance.toFixed(2)}` },
    { header: 'Net Payable', render: (row) => <span className="font-bold text-red-600">₹{row.net.toFixed(2)}</span> },
    { header: 'Clearance Status', render: (row) => (
      <Badge variant={row.status === 'Cleared' ? 'success' : 'warning'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedPatient(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'Pending' && (
          <button 
            title="Clear" 
            onClick={() => { setSelectedPatient(row); setIsModalOpen(true); }}
            className="p-1.5 text-success hover:bg-green-50 rounded-lg"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        <button title="Print" className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"><Printer className="w-4 h-4" /></button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pharmacy Clearance</h2>
        <p className="text-sm text-gray-500 font-medium">Finalize patient medicine bills and advance adjustments before discharge</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        searchPlaceholder="Search by Patient Name, UHID, Ward..."
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        filters={[
          { label: 'Ward', name: 'ward', options: [{ label: 'General Ward', value: 'gw' }, { label: 'ICU', value: 'icu' }] }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={pageSize === 'All' ? filteredClearance : filteredClearance.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
        <Pagination totalRecords={filteredClearance.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Patient Final Clearance"
        maxWidth="sm:max-w-2xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={() => { 
                setClearanceList(clearanceList.map(p => p.id === selectedPatient.id ? { ...p, status: 'Cleared' } : p));
                toast.success('Clearance completed!'); 
                setIsModalOpen(false); 
             }} className="flex-1 px-8 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                <FileCheck className="w-4 h-4"/> Confirm Clearance
             </button>
          </div>
        }
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</p>
                  <p className="text-sm font-bold text-slate-800">{selectedPatient.patient}</p>
               </div>
               <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission Date</p>
                  <p className="text-sm font-bold text-slate-800">{selectedPatient.admission}</p>
               </div>
               <div className="space-y-1 col-span-2 pt-2 text-slate-400 uppercase tracking-widest font-bold text-[10px]">
                  Ward / Bed Info
               </div>
               <div className="col-span-2">
                  <p className="text-sm font-bold text-slate-800">{selectedPatient.ward}</p>
               </div>
            </div>

            <div className="space-y-4 pt-2">
               <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                  <span className="text-sm text-slate-500 font-medium tracking-tight">Total Outstanding Bills</span>
                  <span className="text-lg font-bold text-slate-700">₹{selectedPatient.due.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                  <span className="text-sm text-success font-bold tracking-tight">Available Advance (Adjustable)</span>
                  <span className="text-lg font-bold text-success">- ₹{selectedPatient.advance.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center py-4 px-6 bg-red-50 rounded-2xl border border-red-100 mt-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Net Payable Amount</span>
                     <span className="text-4xl font-black text-red-600 tracking-tighter">₹{selectedPatient.net.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-red-800 mb-1">Payment Method</p>
                     <select className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold bg-white text-red-800 outline-none">
                        <option>Cash</option>
                        <option>Card</option>
                        <option>UPI</option>
                     </select>
                  </div>
               </div>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Clearance Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium">Patient</p>
                <p className="font-bold">{selectedPatient.patient}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">UHID</p>
                <p className="font-bold">{selectedPatient.uhid}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Due</p>
                <p className="font-bold text-red-600">₹{selectedPatient.due.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Status</p>
                <Badge variant={selectedPatient.status === 'Cleared' ? 'success' : 'warning'}>{selectedPatient.status}</Badge>
              </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
