import React, { useEffect, useState, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, CheckCircle, XCircle, PackageCheck, Loader2 } from 'lucide-react';
import pharmacyService from '../utils/pharmacyService';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles.config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: po, isLoading, isError } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const res = await pharmacyService.api.get(`/pharmacy/purchase-orders/${id}`);
      return res.data?.data || res.data;
    }
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const updateStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      await pharmacyService.api.put(`/pharmacy/purchase-orders/${id}/status`, { status: newStatus });
      toast.success(`Purchase Order marked as ${newStatus}`);
      queryClient.invalidateQueries(['purchase-order', id]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (activeRole !== ROLES.SYSTEM_ADMIN) {
    return <div className="p-10 text-center text-red-500 font-bold">Unauthorized Access</div>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Loading Purchase Order details...</p>
      </div>
    );
  }

  if (isError || !po) {
    return (
      <div className="p-10 text-center text-red-500">
        <h3 className="text-xl font-bold">Purchase Order Not Found</h3>
        <button onClick={() => navigate('/purchase-orders')} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold">Back to List</button>
      </div>
    );
  }

  const variants = { PENDING: 'warning', APPROVED: 'primary', RECEIVED: 'success', CANCELLED: 'danger' };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button 
          onClick={() => navigate('/purchase-orders')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        
        <div className="flex items-center gap-3">
          {po.status === 'PENDING' && (
            <>
              <button onClick={() => updateStatus('CANCELLED')} disabled={isUpdating} className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                <XCircle className="w-4 h-4" /> Cancel PO
              </button>
              <button onClick={() => updateStatus('APPROVED')} disabled={isUpdating} className="px-4 py-2 bg-primary text-white hover:bg-blue-700 shadow-md shadow-primary/20 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Approve PO
              </button>
            </>
          )}
          {po.status === 'APPROVED' && (
            <button onClick={() => updateStatus('RECEIVED')} disabled={isUpdating} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-600/20 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50">
              <PackageCheck className="w-4 h-4" /> Mark Received
            </button>
          )}
          
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 shadow-md rounded-xl font-bold text-sm flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none print:m-0" ref={printRef}>
        {/* Header */}
        <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">PharmaDesk</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Purchase Order</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xl font-bold text-slate-900">PO No: {po.poNumber}</p>
            <p className="text-sm text-slate-500 mt-1">Date: {po.poDate ? new Date(po.poDate).toLocaleDateString('en-IN') : new Date(po.createdAt || Date.now()).toLocaleDateString('en-IN')}</p>
            <div className="mt-3 inline-block">
              <Badge variant={variants[po.status] || 'default'} className="px-3 py-1 text-xs">
                {po.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-slate-50 border-b border-slate-100">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supplier Details</h3>
            <p className="font-bold text-slate-900 text-lg">{po.supplierName}</p>
            {po.supplierEmail && <p className="text-sm text-slate-600">{po.supplierEmail}</p>}
            {po.supplierPhone && <p className="text-sm text-slate-600">{po.supplierPhone}</p>}
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Info</h3>
            <p className="font-bold text-slate-900">Expected: {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN') : 'N/A'}</p>
            {po.notes && <p className="text-sm text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-200">Notes: {po.notes}</p>}
          </div>
        </div>

        {/* Line Items */}
        <div className="p-10">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold rounded-tl-xl rounded-bl-xl">Medicine Name</th>
                <th className="px-4 py-3 text-center font-bold">Qty</th>
                <th className="px-4 py-3 text-right font-bold">Unit Price</th>
                <th className="px-4 py-3 text-right font-bold rounded-tr-xl rounded-br-xl">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.lineItems?.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-4 font-bold text-slate-800">{item.medicineName}</td>
                  <td className="px-4 py-4 text-center">{item.orderedQuantity}</td>
                  <td className="px-4 py-4 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-800">₹{(Number(item.lineTotal) || (Number(item.orderedQuantity) * Number(item.unitPrice))).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-10 bg-slate-50 flex justify-end">
          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span>₹{Number(po.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Tax (GST)</span>
              <span>₹{Number(po.gstAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-slate-900 pt-4 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-primary">₹{Number(po.totalValue || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .bg-white.rounded-3xl { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .bg-white.rounded-3xl * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}
