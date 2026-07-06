import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import ReactBarcode from 'react-barcode';
import { Plus, Search, Eye, Edit3, Pill, Save, CheckCircle, Barcode, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useMedicineStore } from '../store/useMedicineStore';
import { cn } from '../utils/cn';

const TABS = ['Basic Info', 'Pricing & Tax', 'Stock Settings', 'Clinical Details', 'Storage & Handling', 'Barcode'];

const DRUG_CLASSES = ['Analgesic', 'Antibiotic', 'Antidiabetic', 'Antihypertensive', 'Antihistamine', 'Antifungal', 'Antiviral', 'Cardiac', 'Hormonal', 'Lipid-Lowering', 'Nutritional Supplement', 'Psychotropic', 'Vaccine', 'Others'];
const SCHEDULES = ['OTC', 'Schedule H', 'Schedule H1', 'Schedule X', 'Narcotic'];
const STORAGES = ['Room Temperature (15–25°C)', 'Refrigerated (2–8°C)', 'Frozen (below 0°C)', 'Cool and Dry', 'Protect from Light', 'Flammable / Special Handling'];
const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Vial', 'Cream', 'Inhaler'];
const NON_MEDICINE_CATEGORIES = ['Biscuit', 'Chocolate', 'Juice', 'Beverage', 'Snacks', 'Personal Care', 'Other'];
const MEDICINE_UNITS = ['Strip', 'Bottle', 'Vial', 'Ampoule', 'Tube'];
const NON_MEDICINE_UNITS = ['Piece', 'Pack', 'Box', 'Kg', 'Litre', 'Set', 'Unit'];
import { usePageData } from '../hooks/usePageData';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import pharmacyService from '../utils/pharmacyService';
import TableSkeleton from '../components/ui/TableSkeleton';
import useDebounce from '../hooks/useDebounce';

export default function MedicineMaster() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [drugClassFilter, setDrugClassFilter] = useState('ALL');
  const [scheduleFilter, setScheduleFilter] = useState('ALL');
  const [productTypeFilter, setProductTypeFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const { items: allMedicines = [], isLoading: loading, page, goToPage, size } = usePageData(
    'medicines',
    '/pharmacy/medicines'
  );

  const handleDateChange = (type, date) => {
    setDateRange(prev => {
      const next = { ...prev, [type]: date };
      // Validation: To Date cannot precede From Date
      if (next.from && next.to && next.to < next.from) {
        if (type === 'from') {
          next.to = null; // Reset 'to' if 'from' is moved past it
        } else {
          toast.error("To Date cannot be earlier than From Date");
          return prev; // Reject change
        }
      }
      return next;
    });
  };

  const filteredMedicines = React.useMemo(() => {
    return allMedicines.filter(m => {
      const matchesSearch = !debouncedSearch || 
        (m.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        (m.genericName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (m.medicineCode || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const classMatch = drugClassFilter === 'ALL' || m.drugClass === drugClassFilter;
      const scheduleMatch = scheduleFilter === 'ALL' || m.schedule === scheduleFilter;
      const typeMatch = productTypeFilter === 'ALL' || m.productType === productTypeFilter;
      
      // Date Range Filter
      let dateMatch = true;
      if (dateRange.from || dateRange.to) {
        const itemDate = new Date(m.createdAt || new Date());
        itemDate.setHours(0, 0, 0, 0);

        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (itemDate < fromDate) dateMatch = false;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(0, 0, 0, 0);
          if (itemDate > toDate) dateMatch = false;
        }
      }

      return matchesSearch && classMatch && scheduleMatch && typeMatch && dateMatch;
    });
  }, [allMedicines, debouncedSearch, drugClassFilter, scheduleFilter, productTypeFilter, dateRange]);

  const totalElements = filteredMedicines.length;
  const medicines = React.useMemo(() => {
    const start = page * size;
    return filteredMedicines.slice(start, start + size);
  }, [filteredMedicines, page, size]);

  useEffect(() => {
    goToPage(0);
  }, [debouncedSearch, drugClassFilter, scheduleFilter, productTypeFilter]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => pharmacyService.getSuppliers().then(res => res.data)
  });

  const createMedicineMutation = useMutation({
    mutationFn: (formData) => pharmacyService.createMedicine(formData),
    onSuccess: () => {
      toast.success('Medicine created successfully!');
      queryClient.invalidateQueries(['medicines']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error creating medicine')
  });

  const updateMedicineMutation = useMutation({
    mutationFn: ({ id, formData }) => pharmacyService.updateMedicine(id, formData),
    onSuccess: () => {
      toast.success('Medicine updated successfully!');
      queryClient.invalidateQueries(['medicines']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error updating medicine')
  });

  const deleteMedicineMutation = useMutation({
    mutationFn: (id) => pharmacyService.deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['medicines']);
      toast.success('Medicine deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete medicine');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      deleteMedicineMutation.mutate(id);
    }
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('Basic Info');
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));

  const [visibleColumns, setVisibleColumns] = useState({
    code: true, hsn: false, mrp: true, stock: true, generic: true, manufacturer: true, barcode: false
  });

  const [formData, setFormData] = useState({
    name: '', genericName: '', medicineCode: '', manufacturer: '', supplierVendor: '', supplier: null, productType: 'MEDICINE',
    packSize: '', unitsPerPack: 1, unit: 'Strip', category: 'Tablet', mrp: '', purchasePrice: '', salePrice: '',
    hsnCode: '', taxPercentage: 12.0, reorderLevel: 10, drugClass: 'Analgesic', storageConditions: 'Room Temperature (15–25°C)',
    schedule: 'OTC', substitutes: '', barcode: ''
  });



  const openModal = (medicine = null) => {
    if (medicine) {
      setIsEditMode(true);
      setSelectedMedicineId(medicine.id);
      setFormData({
        name: medicine.name || '',
        genericName: medicine.genericName || '',
        medicineCode: medicine.medicineCode || '',
        manufacturer: medicine.manufacturer || '',
        supplierVendor: medicine.supplierVendor || '',
        supplier: medicine.supplierId ? { id: medicine.supplierId, name: medicine.supplierName, address: medicine.supplierAddress, gstin: medicine.supplierGstin, contact: medicine.supplierContact } : null,
        productType: medicine.productType || 'MEDICINE',
        packSize: medicine.packSize || '',
        unitsPerPack: medicine.unitsPerPack || 1,
        unit: medicine.unit || (medicine.productType === 'NON_MEDICINE' ? 'Piece' : 'Strip'),
        category: medicine.category || (medicine.productType === 'NON_MEDICINE' ? 'Biscuit' : 'Tablet'),
        mrp: medicine.mrp || '',
        purchasePrice: medicine.purchasePrice || '',
        salePrice: medicine.salePrice || '',
        hsnCode: medicine.hsnCode || '',
        taxPercentage: medicine.taxPercentage || 0,
        reorderLevel: medicine.reorderLevel || 10,
        drugClass: medicine.drugClass || 'Analgesic',
        storageConditions: medicine.storageConditions || 'Room Temperature (15–25°C)',
        schedule: medicine.schedule || 'OTC',
        substitutes: medicine.substitutes || '',
        barcode: medicine.barcode || ''
      });
      setSupplierSearch(medicine.supplierName || medicine.supplierVendor || '');
    } else {
      setIsEditMode(false);
      setSelectedMedicineId(null);
      setFormData({
        name: '', genericName: '', medicineCode: '', manufacturer: '', supplierVendor: '', supplier: null, productType: 'MEDICINE',
        packSize: '', unitsPerPack: 1, unit: 'Strip', category: 'Tablet', mrp: '', purchasePrice: '', salePrice: '',
        hsnCode: '', taxPercentage: 12.0, reorderLevel: 10, drugClass: 'Analgesic', storageConditions: 'Room Temperature (15–25°C)',
        schedule: 'OTC', substitutes: '', barcode: ''
      });
      setSupplierSearch('');
    }
    setErrors({});
    setActiveModalTab('Basic Info');
    setIsModalOpen(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Brand Name is required';
    if (!formData.genericName.trim()) newErrors.genericName = formData.productType === 'NON_MEDICINE' ? 'Description is required' : 'Generic Name is required';
    if (!formData.hsnCode.trim()) newErrors.hsnCode = 'HSN Code is required';
    else if (formData.hsnCode.length < 4) newErrors.hsnCode = 'HSN Code must be at least 4 digits';
    
    const pp = Number(formData.purchasePrice);
    const sp = Number(formData.salePrice);
    const mrp = Number(formData.mrp);

    if (formData.purchasePrice !== '' && pp < 0) newErrors.purchasePrice = 'Must be ≥ 0';
    if (formData.salePrice !== '' && sp < 0) newErrors.salePrice = 'Must be ≥ 0';
    if (formData.mrp !== '' && mrp < 0) newErrors.mrp = 'Must be ≥ 0';
    
    if (formData.purchasePrice !== '' && formData.salePrice !== '' && pp > sp) newErrors.salePrice = 'Sale Price cannot be less than Purchase Price';
    if (formData.salePrice !== '' && formData.mrp !== '' && sp > mrp) newErrors.mrp = 'MRP cannot be less than Sale Price';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.error('Please fix the validation errors before saving');
      
      // Auto-switch to the tab with errors
      if (errors.name || errors.genericName) {
        setActiveModalTab('Basic Info');
      } else if (errors.hsnCode || errors.purchasePrice || errors.salePrice || errors.mrp) {
        setActiveModalTab('Pricing & Tax');
      }
      return;
    }
    
    const payload = {
      ...formData,
      mrp: formData.mrp === '' ? null : Number(formData.mrp),
      purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
      salePrice: formData.salePrice === '' ? null : Number(formData.salePrice),
      taxPercentage: formData.taxPercentage === '' ? 0 : Number(formData.taxPercentage),
      reorderLevel: formData.reorderLevel === '' ? null : Number(formData.reorderLevel),
      unitsPerPack: formData.unitsPerPack === '' ? 1 : Number(formData.unitsPerPack),
      barcode: formData.barcode === '' ? null : formData.barcode,
      medicineCode: formData.medicineCode === '' ? null : formData.medicineCode,
    };

    if (isEditMode) {
      updateMedicineMutation.mutate({ id: selectedMedicineId, formData: payload }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMedicineMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  // Derived styling for preview
  const isHighAlert = ['Schedule H1', 'Schedule X', 'Narcotic'].includes(formData.schedule);
  const isColdChain = ['Refrigerated (2–8°C)', 'Frozen (below 0°C)'].includes(formData.storageConditions);

  const columns = React.useMemo(() => [
    { header: 'S.No', render: (r, i) => <span className="text-slate-500 font-medium">{i + 1}</span> },
    { header: 'Code', accessor: 'medicineCode', render: (r) => <span className="font-mono text-xs">{r.medicineCode || '-'}</span> },
    { header: 'Medicine Name', render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-900 whitespace-nowrap">{r.name}</span>
        {r.productType === 'NON_MEDICINE' ? <Badge variant="warning" className="text-[10px] py-0 px-1.5">General</Badge> : <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-blue-100 text-blue-800">Rx</Badge>}
      </div>
    )},
    { header: 'Generic Name', render: (r) => <span className="text-slate-600 whitespace-nowrap">{r.genericName}</span> },
    { header: 'Manufacturer', accessor: 'manufacturer', render: (r) => <span className="text-slate-600 whitespace-nowrap">{r.manufacturer || '-'}</span> },
    { header: 'Category', accessor: 'category', render: (r) => <span className="text-slate-600">{r.category || '-'}</span> },
    { header: 'Unit', accessor: 'unit', render: (r) => <span className="text-slate-600">{r.unit || '-'}</span> },
    { header: 'Stock Count', render: (r) => (
      <Badge variant={(r.currentStock || 0) <= (r.reorderLevel || 10) ? 'danger' : 'success'}>
        {r.currentStock || 0}
      </Badge>
    )},
    { header: 'MRP', render: (r) => <span className="text-sm font-medium">₹{r.mrp || 0}</span> },
    { header: 'GST %', render: (r) => <span className="text-sm text-slate-600">{r.taxPercentage || 0}%</span> },
    { header: 'Schedule', render: (r) => (
      r.productType === 'NON_MEDICINE' ? <span className="text-xs text-slate-400">-</span> :
      <div className={cn("text-xs font-bold whitespace-nowrap", ['Schedule H1', 'Schedule X', 'Narcotic'].includes(r.schedule) ? "text-red-600" : "text-slate-500")}>
        {r.schedule || 'OTC'}
      </div>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => openModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-transparent transition-colors" title="Edit">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-transparent transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-medium tracking-tight text-slate-900">Medicine Master</h2>
        <p className="text-sm text-slate-500 font-normal">Central registry of all medicines, pricing, clinical details, and stock triggers.</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm} 
        searchValue={searchTerm} 
        searchPlaceholder="Search by Name, Generic Name, Code..."
        dateRange={dateRange}
        onDateChange={handleDateChange}
      >
        <select value={drugClassFilter} onChange={(e) => setDrugClassFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none">
          <option value="ALL">All Drug Classes</option>
          {DRUG_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none">
          <option value="ALL">All Schedules</option>
          {SCHEDULES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none">
          <option value="ALL">All Product Types</option>
          <option value="MEDICINE">Medicine (Rx/OTC)</option>
          <option value="NON_MEDICINE">Non-Medicine (FMCG)</option>
        </select>
        <button onClick={() => openModal()} className="px-5 py-2 bg-[#1a3c6e] text-white rounded-md text-sm font-medium hover:bg-[#122b50] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </ModuleFilterBar>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <TableSkeleton rows={10} columns={10} />
        ) : (
          <>
            <DataTable columns={columns} data={medicines} striped />
            {totalElements > 0 && (
              <Pagination totalRecords={totalElements} currentPage={page + 1} pageSize={size} onPageChange={(p) => goToPage(p - 1)} onPageSizeChange={() => {}} />
            )}
          </>
        )}
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Medicine Record" : "Register New Medicine"}
        maxWidth="sm:max-w-6xl"
        footer={
          <div className="flex justify-end gap-3 w-full border-t border-slate-100 pt-4">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={createMedicineMutation.isPending || updateMedicineMutation.isPending} className="px-8 py-2 bg-[#1a3c6e] text-white rounded-md text-sm font-medium hover:bg-[#122b50] flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {createMedicineMutation.isPending || updateMedicineMutation.isPending ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Register Medicine')}
            </button>
          </div>
        }
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col h-[600px]">
            {/* TABS */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
              {TABS.filter(t => formData.productType === 'NON_MEDICINE' ? t !== 'Clinical Details' : true).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveModalTab(tab)}
                  className={cn("px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors outline-none", 
                    activeModalTab === tab ? "border-[#1a3c6e] text-[#1a3c6e] bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {activeModalTab === 'Basic Info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2 mb-2 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Product Type</h4>
                      <p className="text-xs text-slate-500">Is this a clinical drug or a general retail item?</p>
                    </div>
                    <div className="flex bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                      <button 
                        onClick={() => { setFormData({...formData, productType: 'MEDICINE', category: 'Tablet', schedule: 'OTC', drugClass: 'Analgesic', unit: 'Strip'}); setActiveModalTab('Basic Info'); }}
                        className={cn("px-4 py-2 text-sm font-medium transition-colors", formData.productType === 'MEDICINE' ? "bg-[#1a3c6e] text-white" : "text-slate-600 hover:bg-slate-50")}
                      >
                        Medicine (Rx/OTC)
                      </button>
                      <button 
                        onClick={() => { setFormData({...formData, productType: 'NON_MEDICINE', category: 'Biscuit', schedule: 'N/A', drugClass: 'N/A', unit: 'Piece'}); setActiveModalTab('Basic Info'); }}
                        className={cn("px-4 py-2 text-sm font-medium transition-colors", formData.productType === 'NON_MEDICINE' ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50")}
                      >
                        Non-Medicine (FMCG)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Brand Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); if(errors.name) setErrors({...errors, name: null}); }} className={cn("w-full px-3 py-2 border rounded-md focus:outline-none", errors.name ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 bg-slate-50 focus:border-blue-500")} />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">{formData.productType === 'NON_MEDICINE' ? 'Description' : 'Generic Name'} <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.genericName} onChange={e => { setFormData({...formData, genericName: e.target.value}); if(errors.genericName) setErrors({...errors, genericName: null}); }} className={cn("w-full px-3 py-2 border rounded-md focus:outline-none", errors.genericName ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 bg-slate-50 focus:border-blue-500")} />
                    {errors.genericName && <p className="text-xs text-red-500">{errors.genericName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Item Code</label>
                    <input type="text" value={formData.medicineCode} placeholder="Auto-generated if empty" disabled={isEditMode && formData.medicineCode} onChange={e => setFormData({...formData, medicineCode: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Manufacturer / Brand</label>
                    <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-medium text-slate-700">Primary Vendor</label>
                    <input 
                      type="text" 
                      placeholder="Search and select supplier..." 
                      value={supplierSearch} 
                      onChange={e => setSupplierSearch(e.target.value)} 
                      onFocus={() => { setSupplierSearch(''); setShowSupplierDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" 
                    />
                    {showSupplierDropdown && (
                      <div className="absolute z-[100] left-0 top-full mt-1 w-full bg-white shadow-xl border border-slate-200 rounded-md max-h-48 overflow-y-auto">
                        {filteredSuppliers.map(s => (
                          <div 
                            key={s.id} 
                            onMouseDown={(e) => { e.preventDefault(); setFormData({...formData, supplier: s, supplierVendor: s.name}); setSupplierSearch(s.name); setShowSupplierDropdown(false); }} 
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="font-medium text-sm text-slate-800">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.city} | GST: {s.gstin}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                      {(formData.productType === 'NON_MEDICINE' ? NON_MEDICINE_CATEGORIES : CATEGORIES).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Unit of Measure</label>
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                      {(formData.productType === 'NON_MEDICINE' ? NON_MEDICINE_UNITS : MEDICINE_UNITS).map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Pack Size Label</label>
                    <input type="text" placeholder={formData.productType === 'NON_MEDICINE' ? "e.g. 10 pcs/box" : "e.g. 10 tablets/strip"} value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Units per Pack</label>
                    <input type="number" min="1" placeholder="1" value={formData.unitsPerPack} onChange={e => setFormData({...formData, unitsPerPack: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                  </div>
                </div>
              )}

              {activeModalTab === 'Pricing & Tax' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Purchase Price (per unit)</label>
                    <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => { setFormData({...formData, purchasePrice: e.target.value}); if(errors.purchasePrice) setErrors({...errors, purchasePrice: null, salePrice: null, mrp: null}); }} className={cn("w-full px-3 py-2 border rounded-md outline-none", errors.purchasePrice ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-[#1a3c6e]")} />
                    {errors.purchasePrice && <p className="text-xs text-red-500">{errors.purchasePrice}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Sale Price (per unit)</label>
                    <input type="number" step="0.01" value={formData.salePrice} onChange={e => { setFormData({...formData, salePrice: e.target.value}); if(errors.salePrice) setErrors({...errors, salePrice: null, mrp: null}); }} className={cn("w-full px-3 py-2 border rounded-md outline-none", errors.salePrice ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-[#1a3c6e]")} />
                    {errors.salePrice && <p className="text-xs text-red-500">{errors.salePrice}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">MRP (per unit)</label>
                    <input type="number" step="0.01" value={formData.mrp} onChange={e => { setFormData({...formData, mrp: e.target.value}); if(errors.mrp) setErrors({...errors, mrp: null}); }} className={cn("w-full px-3 py-2 border rounded-md outline-none", errors.mrp ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-[#1a3c6e]")} />
                    {errors.mrp && <p className="text-xs text-red-500">{errors.mrp}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">HSN Code <span className="text-red-500">*</span></label>
                    <input type="text" maxLength={6} placeholder="6-digit compliance code" value={formData.hsnCode} onChange={e => { setFormData({...formData, hsnCode: e.target.value}); if(errors.hsnCode) setErrors({...errors, hsnCode: null}); }} className={cn("w-full px-3 py-2 border rounded-md font-mono outline-none", errors.hsnCode ? "border-red-400 bg-red-50 focus:border-red-500" : "border-slate-200 bg-slate-50 focus:border-blue-500")} />
                    {errors.hsnCode && <p className="text-xs text-red-500">{errors.hsnCode}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">GST Percentage</label>
                    <select value={formData.taxPercentage} onChange={e => setFormData({...formData, taxPercentage: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  </div>
                </div>
              )}

              {activeModalTab === 'Stock Settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Reorder Level Alert Threshold</label>
                    <input type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
                    <p className="text-xs text-slate-500">System alerts when stock falls below this quantity.</p>
                  </div>
                </div>
              )}

              {activeModalTab === 'Clinical Details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Drug Class</label>
                      <select value={formData.drugClass} onChange={e => setFormData({...formData, drugClass: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                        {DRUG_CLASSES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Schedule / Regulatory Class</label>
                      <select value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className={cn("w-full px-3 py-2 rounded-md outline-none border", isHighAlert ? "border-red-300 bg-red-50 text-red-900" : "border-slate-200")}>
                        {SCHEDULES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      {isHighAlert && <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/> Mandatory compliance logging required at dispensing.</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-4 border-t border-slate-100">
                    <label className="text-sm font-medium text-blue-600 flex items-center gap-2">Substitute Links</label>
                    <p className="text-xs text-slate-500 mb-2">Enter comma-separated Medicine Codes or IDs of direct substitutes.</p>
                    <input type="text" placeholder="e.g. MED-1045, MED-2091" value={formData.substitutes} onChange={e => setFormData({...formData, substitutes: e.target.value})} className="w-full px-3 py-2 border border-blue-200 rounded-md outline-none focus:border-blue-500 font-mono" />
                  </div>
                </div>
              )}

              {activeModalTab === 'Storage & Handling' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Storage Conditions</label>
                    <select value={formData.storageConditions} onChange={e => setFormData({...formData, storageConditions: e.target.value})} className={cn("w-full px-3 py-2 rounded-md outline-none border", isColdChain ? "border-blue-300 bg-blue-50" : "border-slate-200")}>
                      {STORAGES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {isColdChain && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Cold Chain Monitoring Enabled</h4>
                        <p className="text-xs text-blue-700 mt-1">This item will be flagged for temperature log tracking in the inventory module.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === 'Barcode' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Barcode / UPC Number</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Scan or type barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-1 px-3 py-2 border border-slate-200 rounded-md outline-none font-mono" />
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          if (!formData.barcode) { 
                            setFormData({...formData, barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() }); 
                          } 
                        }} 
                        className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-100"
                      >
                        Simulate Scan
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-lg bg-slate-50 mt-6">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Live Scannable Barcode</span>
                      {formData.barcode ? (
                        <div className="bg-white p-4 rounded shadow-sm">
                          <ReactBarcode value={formData.barcode} height={60} width={2} fontSize={14} background="#ffffff" />
                        </div>
                      ) : (
                        <div className="h-[100px] flex items-center justify-center text-slate-400 text-sm">
                          Enter or scan a barcode to preview
                        </div>
                      )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW CARD */}
          <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-lg p-5 flex flex-col h-[600px] overflow-y-auto">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Registry Preview</h3>
            
            <div className={cn("rounded-lg border p-4 mb-4", isHighAlert && formData.productType === 'MEDICINE' ? "border-red-200 bg-red-50/30" : "border-slate-200")}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono font-medium text-slate-500 bg-white border border-slate-200 px-1.5 rounded">{formData.medicineCode || 'MED-XXXX'}</span>
                {formData.productType === 'NON_MEDICINE' ? <Badge variant="warning">General</Badge> : (isHighAlert ? <Badge variant="danger">{formData.schedule}</Badge> : <Badge variant="default">Rx/OTC</Badge>)}
              </div>
              <h2 className="text-xl font-medium text-slate-900 leading-tight mb-1">{formData.name || 'Item Name'}</h2>
              <p className="text-sm text-[#1a3c6e] font-medium">{formData.genericName || 'Description / Salt Name'}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-sm">
                {formData.productType === 'MEDICINE' && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Class</span>
                    <span className="font-medium text-slate-700">{formData.drugClass}</span>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Category</span>
                  <span className="font-medium text-slate-700">{formData.category} ({formData.unit})</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-slate-400 uppercase">Storage</span>
                  <span className="font-medium text-slate-700">{formData.storageConditions}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">MRP</span>
                <span className="text-sm font-medium text-slate-900">₹{formData.mrp || '0.00'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">GST</span>
                <span className="text-sm font-medium text-slate-900">{formData.taxPercentage}% (HSN: {formData.hsnCode || '---'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Pack</span>
                <span className="text-sm font-medium text-slate-900">{formData.packSize || '-'} ({formData.unitsPerPack || 1} units)</span>
              </div>
              {formData.barcode && (
                <div className="pt-4 flex flex-col items-center border-t border-slate-100">
                  <ReactBarcode value={formData.barcode} height={40} width={1.5} fontSize={12} displayValue={true} />
                </div>
              )}
              {formData.supplier && (
                <div className="pt-4 flex flex-col border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Primary Vendor</span>
                  <span className="text-sm font-semibold text-slate-800">{formData.supplier.name}</span>
                  <span className="text-xs text-slate-500 mt-1">{formData.supplier.address}</span>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-slate-600">GST: <span className="font-medium text-slate-800">{formData.supplier.gstin || 'N/A'}</span></span>
                    <span className="text-slate-600">Ph: <span className="font-medium text-slate-800">{formData.supplier.contact || 'N/A'}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
