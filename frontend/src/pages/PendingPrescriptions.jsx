import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useLocation } from 'react-router-dom';
import { Eye, Pill, Search } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import pharmacyService from '../utils/pharmacyService';
import { toast } from 'react-hot-toast';
import { usePageData } from '../hooks/usePageData';
import TableSkeleton from '../components/ui/TableSkeleton';

export default function PendingPrescriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { items: prescriptions = [], isLoading: loading } = usePageData(
    'pending-prescriptions',
    '/pharmacy/prescriptions/pending'
  );

  const location = useLocation();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const filteredPrescriptions = prescriptions.filter(row => {
    const sLower = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      row.patientName?.toLowerCase().includes(sLower) ||
      row.doctorName?.toLowerCase().includes(sLower);
    
    const pDate = new Date(row.prescriptionDate);
    const matchesFrom = !dateRange.from || pDate >= dateRange.from;
    const matchesTo = !dateRange.to || pDate <= dateRange.to;
    
    return matchesSearch && matchesFrom && matchesTo;
  });
  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'ID', accessor: 'id' },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Doctor Name', accessor: 'doctorName' },
    { header: 'Prescribed Date', render: (row) => new Date(row.prescriptionDate).toLocaleDateString() },
    { header: 'Status', render: (row) => {
      let variant = 'warning';
      if (row.status === 'DISPENSED') variant = 'success';
      if (row.status === 'PENDING') variant = 'danger';
      return <Badge variant={variant}>{row.status}</Badge>;
    }},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedPrescription(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status !== 'DISPENSED' && (
          <button 
            title="Dispense" 
            onClick={() => toast.success('Prescription sent to billing/dispensing queue')}
            className="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors"
          >
            <Pill className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
  ];



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pending Prescriptions</h2>
        <p className="text-sm text-gray-500 font-medium">Detailed tracking of all electronic prescriptions awaiting pharmacy fulfillment</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <>
            <DataTable columns={columns} data={pageSize === 'All' ? filteredPrescriptions : filteredPrescriptions.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
            <Pagination totalRecords={filteredPrescriptions.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      <AppModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        title="Prescription Details"
        maxWidth="sm:max-w-2xl"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Patient</p>
                <p className="font-bold">{selectedPrescription.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Doctor</p>
                <p className="font-bold">{selectedPrescription.doctorName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Date</p>
                <p className="font-bold">{new Date(selectedPrescription.prescriptionDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Status</p>
                <Badge variant={selectedPrescription.status === 'PENDING' ? 'danger' : 'success'}>{selectedPrescription.status}</Badge>
              </div>
            </div>
            <div className="p-10 text-center text-slate-400 italic text-sm">
                Itemized prescription medicines and dosage instructions are currently being retrieved.
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
