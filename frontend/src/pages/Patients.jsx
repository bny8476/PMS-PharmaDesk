import React, { useState, useEffect, useMemo } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Search, Users, Trash2, Edit3, Save, XCircle, Phone, MapPin, CreditCard, User, Calendar, History } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { usePageData } from '../hooks/usePageData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import pharmacyService from '../utils/pharmacyService';
import TableSkeleton from '../components/ui/TableSkeleton';

export default function Patients() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { items: patients = [], isLoading: loading } = usePageData(
    'patients',
    '/pharmacy/patients'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'M',
    phone: '',
    address: '',
    insuranceId: ''
  });

  const createPatientMutation = useMutation({
    mutationFn: (data) => pharmacyService.createPatient(data),
    onSuccess: () => {
      toast.success('Patient created successfully');
      queryClient.invalidateQueries(['patients']);
      closeModal();
    },
    onError: () => toast.error('Failed to create patient')
  });

  const updatePatientMutation = useMutation({
    mutationFn: ({ id, data }) => pharmacyService.updatePatient(id, data),
    onSuccess: () => {
      toast.success('Patient updated successfully');
      queryClient.invalidateQueries(['patients']);
      closeModal();
    },
    onError: () => toast.error('Failed to update patient')
  });

  const deletePatientMutation = useMutation({
    mutationFn: (id) => pharmacyService.deletePatient(id),
    onSuccess: () => {
      toast.success('Patient deleted successfully');
      queryClient.invalidateQueries(['patients']);
    },
    onError: () => toast.error('Failed to delete patient')
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('Patient name is required');
      return;
    }
    createPatientMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!formData.name) {
      toast.error('Patient name is required');
      return;
    }
    updatePatientMutation.mutate({ id: selectedPatient.id, data: formData });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this patient record?')) return;
    deletePatientMutation.mutate(id);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedPatient(null);
    setFormData({
      name: '',
      dob: '',
      gender: 'M',
      phone: '',
      address: '',
      insuranceId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (patient) => {
    setIsEditMode(true);
    setSelectedPatient(patient);
    setFormData({
      name: patient.name || '',
      dob: patient.dob || '',
      gender: patient.gender || 'M',
      phone: patient.phone || '',
      address: patient.address || '',
      insuranceId: patient.insuranceId || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedPatient(null);
  };

  const displayedPatients = useMemo(() => {
    let filtered = patients;
    if (searchTerm) {
      const s = debouncedSearch.toLowerCase();
      filtered = patients.filter(p => 
        p.name?.toLowerCase().includes(s) || 
        p.uhid?.toLowerCase().includes(s)
      );
    }
    return pageSize === 'All' ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [patients, searchTerm, currentPage, pageSize]);

  const totalPatients = useMemo(() => {
    if (!debouncedSearch) return patients.length;
    const s = debouncedSearch.toLowerCase();
    return patients.filter(p => 
      p.name?.toLowerCase().includes(s) || 
      p.uhid?.toLowerCase().includes(s)
    ).length;
  }, [patients, searchTerm]);

  const columns = React.useMemo(() => [
    { header: 'S.No', render: (_, i) => i + 1 },
    { 
      header: 'Patient Info', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
            {row.name.substring(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{row.name}</span>
            <span className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-tighter">{row.uhid}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Gender/DOB', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-600">{row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other'}</span>
          <span className="text-[10px] text-slate-400 font-medium">{row.dob || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Contact', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-600">{row.phone || 'N/A'}</span>
          <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{row.address || 'No Address'}</span>
        </div>
      )
    },
    { 
      header: 'Insurance ID', 
      render: (row) => (
        <Badge variant="info" className="font-mono">{row.insuranceId || 'None'}</Badge>
      )
    },
    { 
      header: 'Status', 
      render: () => <Badge variant="success">Active</Badge>
    },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="Edit" 
          onClick={() => openEditModal(row)}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button 
          title="Delete" 
          onClick={() => handleDelete(row.id)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-display">Patient Directory</h2>
        <p className="text-sm text-gray-500 font-medium">Manage patient registrations, UHID tracking, and medical history access</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        actions={[
          { label: 'Register New Patient', icon: Plus, variant: 'primary', onClick: openAddModal }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <>
            <DataTable columns={columns} data={displayedPatients} hover striped virtualized={true} />
            <Pagination totalRecords={totalPatients} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AppModal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={isEditMode ? "Update Patient Details" : "New Patient Registration"}
        maxWidth="sm:max-w-2xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={closeModal} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button onClick={isEditMode ? handleUpdate : handleCreate} className="flex-1 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 font-display">
                <Save className="w-4 h-4"/> {isEditMode ? 'Update Record' : 'Register Patient'}
             </button>
          </div>
        }
      >
        <div className="space-y-6 p-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <User className="w-3 h-3"/> Full Name *
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Rahul Sharma" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white font-bold" 
                  />
              </div>
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3"/> Date of Birth
                  </label>
                  <input 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white" 
                  />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <User className="w-3 h-3"/> Gender
                </label>
                <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                  {['M', 'F', 'O'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setFormData({...formData, gender: g})}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.gender === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3"/> Phone Number
                </label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white font-bold" 
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3"/> Insurance ID
                </label>
                <input 
                  type="text" 
                  value={formData.insuranceId}
                  onChange={(e) => setFormData({...formData, insuranceId: e.target.value})}
                  placeholder="INS-12345678" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white font-mono" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3"/> Address
                </label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Street, City, State..." 
                  rows={1}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white text-sm" 
                />
              </div>
           </div>
        </div>
      </AppModal>
    </div>
  );
}
