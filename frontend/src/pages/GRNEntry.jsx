import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ArrowLeft, Search, Package, CheckCircle2, AlertCircle, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FormInput from '../components/ui/FormInput';

const REJECTION_REASONS = ['Damaged', 'Wrong Item', 'Short Expiry', 'Quality Fail'];
const EMPTY_ITEM = {
  medicine: null, poItemId: null, orderedQuantity: 0,
  receivedQuantity: '', rejectedQuantity: '', rejectionReason: '',
  batchNumber: '', manufacturingDate: '', expiryDate: '', mrp: '', purchaseRate: ''
};

export default function GRNEntry({ onBack }) {
  const queryClient = useQueryClient();

  const { data: rawSuppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await pharmacyService.getSuppliers();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const suppliers = rawSuppliers;
  
  const [poSearch, setPoSearch] = useState('');
  const [po, setPo] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState([EMPTY_ITEM]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const poMutation = useMutation({
    mutationFn: async () => {
      const res = await pharmacyService.api.get(`/pharmacy/purchase-orders?searchTerm=${poSearch}`);
      const page = res.data?.data;
      const found = page?.content?.[0] || null;
      if (!found) throw new Error('No PO found with that number');
      return found;
    },
    onSuccess: (found) => {
      setPo(found);
      setSelectedSupplierId(found.supplier?.id || '');
      setItems(found.items?.map(i => ({
        ...EMPTY_ITEM,
        medicine: i.medicine,
        poItemId: i.id,
        orderedQuantity: i.quantity || 0,
        purchaseRate: i.negotiatedPrice || i.estimatedUnitPrice || ''
      })) || [EMPTY_ITEM]);
      toast.success(`PO loaded: ${found.poNumber}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to load PO');
    }
  });

  const loadPo = () => {
    if (!poSearch.trim()) return;
    poMutation.mutate();
  };

  const setItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const saveMutation = useMutation({
    mutationFn: async ({ payload, confirm }) => {
      const created = await pharmacyService.createGrn(payload);
      if (!created.success) throw new Error('GRN creation failed');

      if (confirm) {
        const confirmed = await pharmacyService.confirmGrn(created.data.id);
        if (!confirmed.success) throw new Error('GRN created but stock update failed');
      }
      return confirm;
    },
    onSuccess: (confirm) => {
      if (confirm) {
        toast.success('GRN confirmed! Stock updated.');
      } else {
        toast.success('GRN saved as draft');
      }
      queryClient.invalidateQueries(['goods-receipts']);
      onBack();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save GRN');
    }
  });

  const handleSave = (confirm = false) => {
    if (!selectedSupplierId) { toast.error('Select a supplier'); return; }
    if (items.some(it => !it.medicine && !it.medicineName)) { toast.error('Each item must have a medicine'); return; }

    const payload = {
      supplier: { id: parseInt(selectedSupplierId) },
      purchaseOrder: po ? { id: po.id } : null,
      supplierInvoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate || null,
      deliveryChallanNumber: challanNumber,
      vehicleNumber,
      status: 'DRAFT',
      items: items.map(it => ({
        medicine: it.medicine ? { id: it.medicine.id } : null,
        poItemId: it.poItemId || null,
        orderedQuantity: parseInt(it.orderedQuantity) || 0,
        receivedQuantity: parseInt(it.receivedQuantity) || 0,
        rejectedQuantity: parseInt(it.rejectedQuantity) || 0,
        rejectionReason: it.rejectionReason || null,
        batchNumber: it.batchNumber || null,
        manufacturingDate: it.manufacturingDate || null,
        expiryDate: it.expiryDate || null,
        mrp: parseFloat(it.mrp) || null,
        purchaseRate: parseFloat(it.purchaseRate) || null,
      }))
    };

    saveMutation.mutate({ payload, confirm });
  };

  const inputCls = "w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Goods Receipt Note (GRN)</h2>
          <p className="text-xs text-slate-400">Record delivery against a Purchase Order</p>
        </div>
      </div>

      {/* PO Loader */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Link to Purchase Order (Optional)</div>
        <div className="flex gap-2">
          <input value={poSearch} onChange={e => setPoSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadPo()}
            placeholder="Enter PO number (e.g. PO-20240622-1234)" className={`flex-1 ${inputCls}`} />
          <button onClick={loadPo} disabled={poMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> {poMutation.isPending ? 'Loading…' : 'Load PO'}
          </button>
        </div>
        {po && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-700">{po.poNumber}</span>
              <span className="text-emerald-600 ml-2">· {po.supplier?.name} · {po.items?.length} item(s) · ₹{Number(po.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Header Details */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">GRN Header Details</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FormInput
            type="select"
            label="Supplier *"
            value={selectedSupplierId}
            onChange={e => setSelectedSupplierId(e.target.value)}
            options={[
              { value: '', label: 'Select supplier' },
              ...suppliers.map(s => ({ value: s.id, label: s.name }))
            ]}
          />
          <FormInput
            label="Supplier Invoice No."
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            placeholder="INV-2024-001"
          />
          <FormInput
            type="date"
            label="Invoice Date"
            value={invoiceDate}
            onChange={e => setInvoiceDate(e.target.value)}
          />
          <FormInput
            label="Delivery Challan No."
            value={challanNumber}
            onChange={e => setChallanNumber(e.target.value)}
            placeholder="DC-2024-001"
          />
          <FormInput
            label="Vehicle Number"
            value={vehicleNumber}
            onChange={e => setVehicleNumber(e.target.value)}
            placeholder="TN 01 AB 1234"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</div>
          <button onClick={addItem} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Medicine','Ordered Qty','Received Qty','Rejected Qty','Rejection Reason','Batch No.','Mfg Date','Expiry Date','MRP (₹)','Purchase Rate',''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 min-w-[160px]">
                    <div className="text-xs font-bold text-slate-700">{item.medicine?.name || (
                      <span className="text-slate-300 italic">No medicine (set via PO)</span>
                    )}</div>
                    {item.medicine?.code && <div className="text-[10px] text-slate-400 font-mono">{item.medicine.code}</div>}
                  </td>
                  <td className="px-3 py-2 text-xs text-center text-slate-500 font-bold">{item.orderedQuantity}</td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" className={inputCls} style={{width:70}}
                      value={item.receivedQuantity} onChange={e => setItem(idx, 'receivedQuantity', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" className={`${inputCls} border-amber-200 focus:border-amber-400`} style={{width:70}}
                      value={item.rejectedQuantity} onChange={e => setItem(idx, 'rejectedQuantity', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputCls} style={{width:130}} value={item.rejectionReason}
                      onChange={e => setItem(idx, 'rejectionReason', e.target.value)}>
                      <option value="">None</option>
                      {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input className={inputCls} style={{width:100}} value={item.batchNumber}
                      onChange={e => setItem(idx, 'batchNumber', e.target.value)} placeholder="BTH001" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="date" className={inputCls} style={{width:130}} value={item.manufacturingDate}
                      onChange={e => setItem(idx, 'manufacturingDate', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="date" className={`${inputCls} focus:border-red-400`} style={{width:130}} value={item.expiryDate}
                      onChange={e => setItem(idx, 'expiryDate', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" className={inputCls} style={{width:80}} value={item.mrp}
                      onChange={e => setItem(idx, 'mrp', e.target.value)} placeholder="0.00" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" className={inputCls} style={{width:80}} value={item.purchaseRate}
                      onChange={e => setItem(idx, 'purchaseRate', e.target.value)} placeholder="0.00" />
                  </td>
                  <td className="px-3 py-2">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={onBack} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
          Cancel
        </button>
        <button onClick={() => handleSave(false)} disabled={saveMutation.isPending}
          className="px-5 py-2.5 border border-blue-200 text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> Save as Draft
        </button>
        <button onClick={() => handleSave(true)} disabled={saveMutation.isPending}
          className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm">
          <CheckCircle2 className="w-4 h-4" /> Confirm GRN & Update Stock
        </button>
      </div>
    </div>
  );
}
