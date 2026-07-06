import React from 'react';
import { Printer, Download, X, MessageCircle } from 'lucide-react';
import { numberToWords } from '../../utils/numberToWords';
import api from '../../utils/api';

export default function PharmacyInvoice({ bill, onClose }) {
  if (!bill) return null;

  // Safe data access
  const safeNum = (val) => isNaN(Number(val)) ? 0 : Number(val);
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return 'N/A'; }
  };

  const handlePrint = () => { 
    setTimeout(() => window.print(), 300); 
  };
  
  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/pharmacy/sales/${bill.id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BILL-${bill.billNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleWhatsApp = () => {
    if (!bill.patient?.phone) return;
    let phone = bill.patient.phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = `91${phone}`;
    }
    const message = `Hi ${bill.patientName || 'Customer'}, your PharmaDesk bill ${bill.billNumber} for ₹${safeNum(bill.netAmount).toFixed(2)} is ready. Thank you!`;
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  return (
    <div className="flex flex-col bg-white h-full max-h-[95vh] overflow-hidden rounded-xl">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 print:hidden">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tax Invoice Preview</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Hint: WhatsApp does not auto-attach PDFs. Download it first to attach manually.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleWhatsApp}
            disabled={!bill.patient?.phone}
            title={!bill.patient?.phone ? "No phone number on file" : "Send via WhatsApp"}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="flex-1 overflow-y-auto p-12 print:p-0 bg-gray-100/50 print:bg-white print:overflow-visible overflow-x-hidden">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-300 print:border-none print:shadow-none p-10 print:p-8" id="invoice-bill">
          
          {/* Top Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-2xl uppercase italic">
                P
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">PHARMADESK <span className="text-blue-600">PRO</span></h1>
                <p className="text-[11px] text-gray-600 font-medium">123, Health Avenue, Medical Square</p>
                <p className="text-[11px] text-gray-600 font-medium">New Delhi - 110001, India</p>
                <p className="text-[11px] text-gray-600 font-medium italic underline">GSTIN: 07AABCM1234F1Z5</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-black text-gray-400 uppercase tracking-[0.2em]">TAX INVOICE</h2>
            </div>
          </div>

          {/* Grid Information */}
          <div className="border border-gray-200 border-b-0">
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div className="p-4 grid grid-cols-2 gap-4 divide-x divide-gray-100">
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase truncate block">Invoice#</span>
                    <p className="text-xs font-black text-gray-800 tracking-tighter">{bill.billNumber}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase truncate block">P.O.#</span>
                    <p className="text-xs font-bold text-gray-800 tracking-tighter">{(bill.billNumber || '').replace('BILL-', 'PO-')}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase truncate block">Invoice Date</span>
                    <p className="text-xs font-bold text-gray-800 tracking-tighter">{formatDate(bill.billingDate)}</p>
                  </div>
                </div>
                <div className="pl-4 space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase truncate block">Place Of Supply</span>
                    <p className="text-xs font-bold text-gray-800 tracking-tighter">Delhi (07)</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase truncate block">Due Date</span>
                    <p className="text-xs font-bold text-gray-800 tracking-tighter">{formatDate(bill.billingDate)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col justify-start">
                 <span className="text-[9px] font-bold text-gray-400 uppercase truncate block mb-1">Bill To / Ship To</span>
                 <p className="text-[13px] font-black text-gray-900 leading-tight">{bill.patientName || 'Walk-in Patient'}</p>
                 <p className="text-[11px] text-gray-600 font-medium">UHID: {bill.patient?.uhid || 'N/A'}</p>
                 <p className="text-[11px] text-gray-600 font-medium">Ref: Dr. {bill.doctorName || 'Self'}</p>
              </div>
            </div>
          </div>

          {/* Items Table - Zoho Style */}
          <div className="border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                  <th className="px-3 py-2 text-center border-r border-gray-200 w-10">#</th>
                  <th className="px-3 py-2 text-left border-r border-gray-200">Item & Description</th>
                  <th className="px-3 py-2 text-center border-r border-gray-200 w-16">Qty</th>
                  <th className="px-3 py-2 text-right border-r border-gray-200 w-24">Rate</th>
                  <th className="px-0 py-0 border-r border-gray-200 w-32">
                    <div className="text-center py-1 border-b border-gray-200">CGST</div>
                    <div className="grid grid-cols-2 text-[9px]">
                      <div className="text-center py-1 border-r border-gray-100">%</div>
                      <div className="text-center py-1">Amt</div>
                    </div>
                  </th>
                  <th className="px-0 py-0 border-r border-gray-200 w-32">
                    <div className="text-center py-1 border-b border-gray-200">SGST</div>
                    <div className="grid grid-cols-2 text-[9px]">
                      <div className="text-center py-1 border-r border-gray-100">%</div>
                      <div className="text-center py-1">Amt</div>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bill.items?.map((item, idx) => {
                  const subtotal = safeNum(item.unitPrice) * safeNum(item.quantity);
                  const halfTax = safeNum(item.taxAmount) / 2;
                  const taxPercent = (safeNum(item.taxAmount) / subtotal) * 100 || 0;
                  return (
                    <tr key={idx} className="text-[11px] font-medium text-gray-800 align-top">
                      <td className="px-3 py-3 text-center border-r border-gray-200 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <div className="font-bold text-gray-900 uppercase tracking-tight mb-1">{item.stock?.medicine?.name}</div>
                        <div className="text-[10px] text-gray-500 font-medium">
                          Batch: {item.stock?.batchNumber} | Exp: {formatDate(item.stock?.expiryDate)}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-1">HSN: {item.stock?.medicine?.hsnCode || '3004'}</div>
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200">{item.quantity}</td>
                      <td className="px-3 py-3 text-right border-r border-gray-200">{safeNum(item.unitPrice).toFixed(2)}</td>
                      <td className="px-0 py-0 border-r border-gray-200">
                         <div className="grid grid-cols-2 h-full min-h-[40px]">
                            <div className="text-center py-3 border-r border-gray-100">{(taxPercent / 2).toFixed(1)}%</div>
                            <div className="text-right pr-2 py-3">{halfTax.toFixed(2)}</div>
                         </div>
                      </td>
                      <td className="px-0 py-0 border-r border-gray-200">
                        <div className="grid grid-cols-2 h-full min-h-[40px]">
                            <div className="text-center py-3 border-r border-gray-100">{(taxPercent / 2).toFixed(1)}%</div>
                            <div className="text-right pr-2 py-3">{halfTax.toFixed(2)}</div>
                         </div>
                      </td>
                      <td className="px-3 py-3 text-right font-bold">{safeNum(item.netAmount).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Section */}
          <div className="mt-8 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 border border-gray-200">
             <div className="flex-1 p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase italic">Total In Words</span>
                  <p className="text-[11px] font-bold text-gray-800 leading-tight italic lowercase first-letter:uppercase">
                    {numberToWords(safeNum(bill.netAmount))}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100 text-[10px] text-gray-600 font-medium leading-relaxed italic">
                  Thanks for your business. Please ensure the medicines are stored correctly. In case of returns, bring the original bill.
                </div>
             </div>
             <div className="w-full md:w-80 p-0 divide-y divide-gray-100">
                <div className="px-6 py-3 flex justify-between text-[11px] font-medium text-gray-600">
                  <span>Sub Total</span>
                  <span className="text-gray-900">{safeNum(bill.subTotal).toFixed(2)}</span>
                </div>
                <div className="px-6 py-3 flex justify-between text-[11px] font-medium text-gray-600">
                  <span>Total Tax</span>
                  <span className="text-gray-900">{safeNum(bill.taxAmount).toFixed(2)}</span>
                </div>
                {safeNum(bill.discountAmount) > 0 && (
                  <div className="px-6 py-3 flex justify-between text-[11px] font-bold text-emerald-600 bg-emerald-50/30">
                    <span>Discount Applied</span>
                    <span>(-) {safeNum(bill.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="px-6 py-3 flex justify-between text-xs font-black bg-gray-50 border-y border-gray-200 text-gray-900">
                  <span className="uppercase tracking-tighter">Total</span>
                  <span>Rs.{safeNum(bill.netAmount).toFixed(2)}</span>
                </div>
                <div className="px-6 py-3 flex justify-between text-[11px] font-medium text-gray-600 lowercase italic">
                  <span>Payment Made ({bill.paymentMode})</span>
                  <span className="text-green-600 italic">(-) {safeNum(bill.paidAmount).toFixed(2)}</span>
                </div>
                <div className="px-6 py-4 flex justify-between text-sm font-black text-blue-600 bg-blue-50/30">
                  <span className="uppercase tracking-tighter">Balance Due</span>
                  <span>Rs.{safeNum(bill.balanceAmount).toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div className="mt-12 flex justify-between items-end border-t border-gray-100 pt-8">
            <div className="text-[11px] text-gray-500 font-medium max-w-xs leading-relaxed italic border-l-2 border-gray-200 pl-4">
              <strong>Terms & Conditions:</strong><br />
              Goods once sold will not be taken back without original bill. 
              Medicine storage requirements must be maintained at all times.
            </div>
            <div className="text-right space-y-8">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Signature</div>
              <div className="w-48 border-t border-gray-300"></div>
              <p className="text-[11px] font-black text-gray-800 tracking-tighter uppercase italic">For PHARMADESK PRO</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
