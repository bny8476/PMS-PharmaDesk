import React, { useState, useMemo } from 'react';
import useDebounce from '../hooks/useDebounce';
import {
  Plus, Search, Edit3, Trash2, X, UserRound, Phone, FileText, MapPin, Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import doctorService from '../utils/doctorService';
import AppModal from '../components/ui/AppModal';

const EMPTY_FORM = {
  name: '', specialization: '', contactNumber: '', registrationNumber: '', clinicAddress: ''
};

function DoctorFormModal({ isOpen, onClose, isEditMode, initialData, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  React.useEffect(() => {
    setForm(isEditMode && initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  }, [isEditMode, initialData, isOpen]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white";
  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1";

  return (
    <AppModal isOpen={isOpen} onClose={onClose}
      title={isEditMode ? 'Edit Doctor' : 'Register New Doctor'}
      maxWidth="sm:max-w-2xl"
      footer={
        <div className="flex w-full gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">
            {isEditMode ? 'Update Doctor' : 'Save Doctor'}
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Doctor Name *</label>
            <input className={inputCls} value={form.name} onChange={f('name')} placeholder="e.g. Dr. Ramesh Kumar" />
          </div>
          <div>
            <label className={labelCls}>Specialization</label>
            <input className={inputCls} value={form.specialization} onChange={f('specialization')} placeholder="e.g. General Physician" />
          </div>
          <div>
            <label className={labelCls}>Contact Number</label>
            <input className={inputCls} value={form.contactNumber} onChange={f('contactNumber')} placeholder="e.g. +91 9876543210" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Registration Number</label>
            <input className={inputCls} value={form.registrationNumber} onChange={f('registrationNumber')} placeholder="e.g. MED123456" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Clinic Address</label>
            <textarea className={inputCls} rows={3} value={form.clinicAddress} onChange={f('clinicAddress')} placeholder="Street, Area, City..." />
          </div>
        </div>
      </div>
    </AppModal>
  );
}

export default function Doctors() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: doctorsPage, isLoading: loading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.getAllDoctors(0, 1000)
  });

  const doctors = doctorsPage?.content || [];

  const createDoctorMutation = useMutation({
    mutationFn: (data) => doctorService.createDoctor(data),
    onSuccess: () => {
      toast.success('Doctor created successfully');
      queryClient.invalidateQueries(['doctors']);
    },
    onError: () => toast.error('Failed to create doctor')
  });

  const updateDoctorMutation = useMutation({
    mutationFn: ({id, data}) => doctorService.updateDoctor(id, data),
    onSuccess: () => {
      toast.success('Doctor updated successfully');
      queryClient.invalidateQueries(['doctors']);
    },
    onError: () => toast.error('Failed to update doctor')
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: (id) => doctorService.deleteDoctor(id),
    onSuccess: () => {
      toast.success('Doctor deleted successfully');
      queryClient.invalidateQueries(['doctors']);
    },
    onError: () => toast.error('Failed to delete doctor')
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const handleSave = async (form) => {
    if (!form.name?.trim()) { toast.error('Doctor name is required'); return; }
    
    if (isEditMode) {
      updateDoctorMutation.mutate(
        { id: selectedDoctor.id, data: form },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createDoctorMutation.mutate(
        form,
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this doctor?')) return;
    deleteDoctorMutation.mutate(id);
  };

  const openAdd = () => { setIsEditMode(false); setSelectedDoctor(null); setIsModalOpen(true); };
  const openEdit = (d) => { setIsEditMode(true); setSelectedDoctor(d); setIsModalOpen(true); };

  const filtered = useMemo(() => {
    const list = doctors || [];
    return list.filter(d => {
      return !debouncedSearch || 
        (d.name?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (d.specialization?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (d.contactNumber?.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
    });
  }, [doctors, searchTerm]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Doctors Directory</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage referring doctors and prescriptions</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-slate-100 p-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, specialization, contact…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {doctors.length} doctors</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            <p className="text-sm text-slate-400 font-bold">Loading doctors…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UserRound className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No doctors found</p>
            <p className="text-xs text-slate-300 mt-1">Add a doctor to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['#','Doctor','Specialization','Contact','Reg Number','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <UserRound className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-sm font-bold text-slate-700">{d.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-600">{d.specialization || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{d.contactNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{d.registrationNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button title="Edit" onClick={() => openEdit(d)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DoctorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditMode={isEditMode}
        initialData={selectedDoctor}
        onSave={handleSave}
      />
    </div>
  );
}
