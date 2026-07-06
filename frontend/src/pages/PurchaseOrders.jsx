import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Search, Plus, Eye, FileText, CheckCircle, XCircle, Trash2, Edit3, Loader2 } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import TableSkeleton from '../components/ui/TableSkeleton';
import ErrorBanner from '../components/ui/ErrorBanner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import pharmacyService from '../utils/pharmacyService';
import { usePurchaseStore } from '../store/usePurchaseStore';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles.config';

export default function PurchaseOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();
  
  const {
    poList,
    poLoading: isLoading,
    poError: isError,
    poPage: page,
    poTotalElements: totalElements,
    poSearchTerm: searchTerm,
    poStatusFilter: statusFilter,
    poDateRange: dateRange,
    setPoSearch: setSearchTerm,
    setPoStatusFilter: setStatusFilter,
    setPoDateRange: setDateRange,
    setPoPage: goToPage,
    fetchPurchaseOrders: refetch
  } = usePurchaseStore(useShallow(state => ({
    poList: state.poList,
    poLoading: state.poLoading,
    poError: state.poError,
    poPage: state.poPage,
    poTotalElements: state.poTotalElements,
    poSearchTerm: state.poSearchTerm,
    poStatusFilter: state.poStatusFilter,
    poDateRange: state.poDateRange,
    setPoSearch: state.setPoSearch,
    setPoStatusFilter: state.setPoStatusFilter,
    setPoDateRange: state.setPoDateRange,
    setPoPage: state.setPoPage,
    fetchPurchaseOrders: state.fetchPurchaseOrders
  })));

  useEffect(() => {
    refetch();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [taxPercent, setTaxPercent] = useState(18);
  const [items, setItems] = useState([
    { id: 1, medicineId: null, medicineName: '', qty: 1, unitPrice: 0 }
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);

  // Pagination, filtering, search and syncing URL are handled by Zustand

  useEffect(() => {
    // Load suppliers for dropdown
    pharmacyService.getSuppliers().then(res => setSuppliers(res.data?.content || res.data || []));
  }, []);

  const handleStockSearch = async (val, idx) => {
    if (val.length < 2) {
      setSearchResults([]);
      setActiveSearchIdx(null);
      return;
    }
    setActiveSearchIdx(idx);
    try {
      const response = await pharmacyService.searchStocks(val);
      setSearchResults(response?.data || response || []);
    } catch (error) {
      console.error(error);
    }
  };

  const selectMedicine = (stock, idx) => {
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      medicineId: stock.medicine?.id || stock.id,
      medicineName: stock.medicine?.name || stock.name || '',
      unitPrice: stock.purchaseRate || 0
    };
    setItems(newItems);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const resetModal = () => {
    setSupplierId('');
    const d = new Date(); d.setDate(d.getDate() + 3);
    setExpectedDeliveryDate(d.toISOString().split('T')[0]);
    setNotes('');
    setTaxPercent(18);
    setItems([{ id: 1, medicineId: null, medicineName: '', qty: 1, unitPrice: 0 }]);
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (Number(item.unitPrice) * Number(item.qty)), 0);
  const calculateTaxAmount = () => (calculateSubtotal() * taxPercent) / 100;
  const calculateGrandTotal = () => calculateSubtotal() + calculateTaxAmount();

  const handleSavePO = async () => {
    if (!supplierId) return toast.error('Please select a supplier');
    if (!expectedDeliveryDate) return toast.error('Please set expected delivery date');
    const validItems = items.filter(i => i.medicineId && i.qty > 0 && i.unitPrice > 0);
    if (validItems.length === 0) return toast.error('Add at least one valid item');

    setIsSubmitting(true);
    const selectedSupplier = suppliers.find(s => s.id === parseInt(supplierId) || s.id === supplierId);

    const payload = {
      supplier: { id: supplierId },
      supplierName: selectedSupplier?.name || 'Unknown Supplier',
      expectedDeliveryDate,
      createdBy: user?.id || 1,
      notes,
      gstAmount: calculateTaxAmount(),
      subtotal: calculateSubtotal(),
      totalValue: calculateGrandTotal(),
      lineItems: validItems.map(i => {
        const itemSubtotal = Number(i.qty) * Number(i.unitPrice);
        const itemGst = (itemSubtotal * taxPercent) / 100;
        return {
          medicine: { id: i.medicineId }, 
          medicineName: i.medicineName,
          orderedQuantity: Number(i.qty), 
          unitPrice: Number(i.unitPrice),
          gstPercentage: taxPercent,
          lineSubtotal: itemSubtotal,
          lineGst: itemGst,
          lineTotal: itemSubtotal + itemGst
        };
      })
    };

    try {
      // Assuming a POST endpoint exists
      const response = await pharmacyService.api.post('/pharmacy/purchase-orders', payload);
      toast.success('Purchase Order created successfully');
      setIsModalOpen(false);
      resetModal();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePO = async (poId) => {
    if (!window.confirm('Are you sure you want to delete this Purchase Order?')) return;
    try {
      await pharmacyService.api.delete(`/pharmacy/purchase-orders/${poId}`);
      toast.success('Purchase Order deleted successfully');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete PO');
    }
  };

  const columns = [
    { header: 'PO No', accessor: 'poNumber' },
    { header: 'Supplier', accessor: 'supplierName' },
    { header: 'Order Date', render: (row) => new Date(row.orderDate || Date.now()).toLocaleDateString('en-IN') },
    { header: 'Expected Delivery', render: (row) => row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString('en-IN') : '-' },
    { header: 'Total Amount', render: (row) => <span className="font-bold">₹{Number(row.totalValue || row.totalAmount || 0).toFixed(2)}</span> },
    {
      header: 'Status', render: (row) => {
        const variants = { draft: 'default', submitted: 'warning', approved: 'primary', completed: 'success', cancelled: 'danger' };
        return <Badge variant={variants[row.status?.toLowerCase()] || 'default'}>{row.status || 'DRAFT'}</Badge>;
      }
    },
    {
      header: 'Action', render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            title="View Details"
            onClick={() => navigate(`/purchase-orders/${row.poId || row.id}`)} 
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            title="Delete PO"
            onClick={() => handleDeletePO(row.poId || row.id)} 
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  if (activeRole !== ROLES.SYSTEM_ADMIN) {
    return <div className="p-10 text-center text-red-500 font-bold">Unauthorized Access</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Orders</h2>
        <p className="text-sm text-gray-500 font-medium">Manage and track supplier purchase orders</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[200px]">
          <ModuleFilterBar searchPlaceholder="Search..."
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            dateRange={dateRange}
            onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
            hideDateRange={false}
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-700"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isError ? (
          <div className="p-6">
            <ErrorBanner onRetry={refetch} message="Failed to load purchase orders. Check connection." />
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : !isLoading && !isError && poList.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-semibold text-lg">No Purchase Orders Found</p>
            <p className="text-sm text-gray-400">Click '+ New PO' to create one.</p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={poList} hover striped />
            {totalElements > 0 && (
              <Pagination
                totalRecords={totalElements}
                currentPage={page + 1}
                pageSize={20}
                onPageChange={(p) => goToPage(p - 1)}
              />
            )}
          </>
        )}
      </div>

      {/* New PO Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetModal(); }}
        title="Create Purchase Order"
        maxWidth="sm:max-w-5xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button onClick={() => { setIsModalOpen(false); resetModal(); }} className="px-6 py-2 border rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={handleSavePO} 
              disabled={isSubmitting}
              className="px-8 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create PO'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white">
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Delivery</label>
              <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
              <input type="text" placeholder="Internal notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white" />
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-visible shadow-sm">
            <div className="overflow-visible">
              <DataTable 
                columns={[
                  {
                    header: 'Medicine Name',
                    render: (item, idx) => (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search medicine..."
                          value={item.medicineName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newItems = [...items];
                            newItems[idx].medicineName = val;
                            setItems(newItems);
                            handleStockSearch(val, idx);
                          }}
                          className="w-full bg-transparent outline-none font-medium"
                        />
                        {searchResults.length > 0 && activeSearchIdx === idx && item.medicineName.length > 1 && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-80 bg-white shadow-2xl border border-blue-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                            {searchResults.map((stock) => (
                              <div key={stock.id} onClick={() => selectMedicine(stock, idx)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b">
                                <div className="font-bold">{stock.medicine?.name || stock.name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    header: <div className="text-center w-32">Qty</div>,
                    render: (item, idx) => (
                      <input type="number" min="1" value={item.qty} onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].qty = e.target.value;
                        setItems(newItems);
                      }} className="w-full text-center border border-slate-200 rounded-lg py-1.5 outline-none" />
                    )
                  },
                  {
                    header: <div className="text-right w-32">Unit Price (₹)</div>,
                    render: (item, idx) => (
                      <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].unitPrice = e.target.value;
                        setItems(newItems);
                      }} className="w-full text-right border border-slate-200 rounded-lg py-1.5 outline-none" />
                    )
                  },
                  {
                    header: <div className="text-right w-32">Total</div>,
                    render: (item) => <div className="text-right font-bold text-slate-700">₹{(Number(item.qty) * Number(item.unitPrice)).toFixed(2)}</div>
                  },
                  {
                    header: <div className="text-center w-12"></div>,
                    render: (item) => (
                      <div className="text-center">
                        <button onClick={() => setItems(items.filter(s => s.id !== item.id))} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={items}
                hover
                striped
              />
            </div>
            <button 
              onClick={() => setItems([...items, { id: Date.now(), medicineId: null, medicineName: '', qty: 1, unitPrice: 0 }])} 
              className="w-full py-3 bg-blue-50/50 hover:bg-blue-50 text-primary text-xs font-bold uppercase tracking-widest border-t transition-colors"
            >
              + Add Row
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-full md:w-80 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Tax (%)</span>
                <input 
                  type="number" 
                  value={taxPercent} 
                  onChange={e => setTaxPercent(e.target.value)} 
                  className="w-16 px-2 py-1 text-right border rounded bg-white outline-none"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax Amount</span>
                <span className="font-bold text-amber-600">₹{calculateTaxAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-3 border-t border-slate-200 font-bold">
                <span className="text-gray-800">Grand Total</span>
                <span className="text-primary">₹{calculateGrandTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
