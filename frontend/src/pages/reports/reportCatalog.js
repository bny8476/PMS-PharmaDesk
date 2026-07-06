import pharmacyService from '../../utils/pharmacyService';
import {
  TrendingUp, Package, ShoppingCart, DollarSign, Shield, Users,
  LayoutGrid, Bell,
} from 'lucide-react';

// ── REPORT CATALOG ─────────────────────────────────────────────────────────────
export const REPORT_CATALOG = [
  // SALES
  {
    id: 'daily-summary', category: 'sales', name: 'Daily Sales Summary',
    desc: 'Total bills, cash vs credit split, GST collected, net revenue',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','PHARMACIST'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales/summary?from=${from}&to=${to}`),
    columns: ['date','billCount','cashBills','creditBills','totalRevenue','totalTax','totalDiscount','netRevenue'],
    headers: ['Period','# Bills','Cash Bills','Credit Bills','Total Revenue','GST Collected','Discounts','Net Revenue']
  },
  {
    id: 'itemised-register', category: 'sales', name: 'Itemised Sales Register',
    desc: 'Every bill line item with medicine, quantity, rate, discount, GST',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','PHARMACIST'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales/itemised?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','doctor','medicine','hsnCode','quantity','unitPrice','discount','tax','netAmount'],
    headers: ['Bill No.','Date','Patient','Doctor','Medicine','HSN','Qty','Rate','Discount','GST','Net Amt']
  },
  {
    id: 'medicine-wise-sales', category: 'sales', name: 'Medicine-wise Sales Report',
    desc: 'Total units sold and revenue per medicine for the period',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','PHARMACIST'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales/medicine-wise?from=${from}&to=${to}`),
    columns: ['medicine','unitsSold','revenue','tax'],
    headers: ['Medicine','Units Sold','Revenue (₹)','GST (₹)']
  },
  {
    id: 'credit-sales', category: 'sales', name: 'Credit Sales Report',
    desc: 'All credit bills with outstanding balance and payment status',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','PHARMACIST','ACCOUNTS'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales/credit?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','netAmount','paidAmount','balanceAmount','status'],
    headers: ['Bill No.','Date','Patient','Net Amt','Paid','Balance','Status']
  },
  {
    id: 'cancelled-bills', category: 'sales', name: 'Cancelled Bills Report',
    desc: 'All voided transactions with reason and authorising user',
    roles: ['SYSTEM_ADMIN','SUPERVISOR'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales/cancelled?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','amount','cancelledBy'],
    headers: ['Bill No.','Date','Patient','Amount','Cancelled By']
  },

  // STOCK
  {
    id: 'current-stock', category: 'stock', name: 'Current Stock Position',
    desc: 'All medicines with quantity, batch, reorder level, stock status',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','STOREKEEPER','PHARMACIST'], hasDateRange: false,
    endpoint: () => pharmacyService.api.get('/pharmacy/reports/stock'),
    columns: ['medicine','category','batch','quantity','unitPrice','mrp','expiry','supplier','value'],
    headers: ['Medicine','Category','Batch','Qty Available','Purchase Rate','MRP','Expiry','Supplier','Stock Value']
  },
  {
    id: 'expiry-report', category: 'stock', name: 'Expiry Report',
    desc: 'Medicines expiring within configured days – Critical (≤15d), Warning (≤30d), Early Alert (≤60d)',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','STOREKEEPER','PHARMACIST'], hasDateRange: false,
    extraFilters: [{ key: 'days', label: 'Within Days', type: 'number', default: 60 }],
    endpoint: (_, __, extra) => pharmacyService.api.get(`/pharmacy/reports/stock/expiry?days=${extra?.days || 60}`),
    columns: ['medicine','batch','expiry','quantity','supplier','daysLeft','urgency'],
    headers: ['Medicine','Batch','Expiry Date','Qty','Supplier','Days Left','Status']
  },
  {
    id: 'slow-moving', category: 'stock', name: 'Slow-Moving Stock Report',
    desc: 'Medicines with dispensing below configured threshold in the period',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','STOREKEEPER'], hasDateRange: true,
    extraFilters: [{ key: 'threshold', label: 'Min Units Sold', type: 'number', default: 5 }],
    endpoint: (from, to, extra) => pharmacyService.api.get(`/pharmacy/reports/stock/slow-moving?from=${from}&to=${to}&threshold=${extra?.threshold || 5}`),
    columns: ['medicine','soldInPeriod'],
    headers: ['Medicine','Units Sold in Period']
  },

  // PURCHASE
  {
    id: 'purchase-register', category: 'purchase', name: 'Purchase Register (GRN)',
    desc: 'All goods receipts with supplier, invoice number, batch, quantity, value',
    roles: ['SYSTEM_ADMIN','SUPERVISOR','STOREKEEPER'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/purchase/register?from=${from}&to=${to}`),
    columns: ['grnNumber','date','supplier','invoiceNumber','status','itemCount'],
    headers: ['GRN No.','Date','Supplier','Invoice No.','Status','Items']
  },
  {
    id: 'outstanding-payables', category: 'purchase', name: 'Outstanding Payables',
    desc: 'Pending invoices grouped by aging buckets (0-30, 31-60, 61+ days)',
    roles: ['SYSTEM_ADMIN','ACCOUNTS'], hasDateRange: false,
    endpoint: () => pharmacyService.api.get('/pharmacy/reports/purchase/payables'),
    columns: ['invoiceNumber','supplier','totalAmount','status','daysOld','agingBucket'],
    headers: ['Invoice No.','Supplier','Amount','Status','Days Old','Aging Bucket']
  },
  {
    id: 'supplier-performance', category: 'purchase', name: 'Supplier Performance Scorecard',
    desc: 'All suppliers ranked by overall score – delivery, fill rate, quality, accuracy',
    roles: ['SYSTEM_ADMIN','SUPERVISOR'], hasDateRange: false,
    endpoint: () => pharmacyService.api.get('/pharmacy/reports/supplier/performance'),
    columns: ['supplier','overallScore','onTimeDelivery','orderFillRate','qualityRejection','invoiceAccuracy'],
    headers: ['Supplier','Overall Score','On-Time Delivery %','Fill Rate %','Rejection %','Invoice Accuracy %']
  },

  // FINANCIAL / GST
  {
    id: 'tax-summary', category: 'gst', name: 'GST Summary Report',
    desc: 'Output GST collected, ITC on purchases, net GST payable – ready for filing',
    roles: ['SYSTEM_ADMIN','ACCOUNTS'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/tax?from=${from}&to=${to}`),
    columns: ['period','totalAmount','taxableAmount','cgst','sgst','igst','totalTax','billCount'],
    headers: ['Period','Total Revenue','Taxable Value','CGST','SGST','IGST','Total GST','Bills']
  },
  {
    id: 'gst-sales-register', category: 'gst', name: 'GST Sales Register (GSTR-1)',
    desc: 'All sales with HSN code, taxable value, CGST/SGST/IGST per line – GSTR-1 format',
    roles: ['SYSTEM_ADMIN','ACCOUNTS'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/gst/sales?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','hsnCode','medicine','quantity','unitPrice','taxableValue','cgst','sgst','igst','totalGst'],
    headers: ['Bill No.','Date','Buyer','HSN','Item','Qty','Rate','Taxable Value','CGST','SGST','IGST','Total GST']
  },

  // COMPLIANCE
  {
    id: 'schedule-h-register', category: 'compliance', name: 'Schedule H/H1 Dispensing Register',
    desc: 'All Schedule H and H1 dispensing with patient, doctor, Rx details – mandatory register',
    roles: ['SYSTEM_ADMIN','COMPLIANCE'], hasDateRange: true, isRestricted: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales/itemised?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','doctor','medicine','quantity','unitPrice'],
    headers: ['Sr. No.','Date','Patient Name','Doctor','Rx Medicine','Qty Dispensed','Rate']
  },
  {
    id: 'narcotic-register', category: 'compliance', name: 'Narcotic & Psychotropic Register',
    desc: 'Legally mandatory NDPS register with running balance and reconciliation',
    roles: ['SYSTEM_ADMIN','COMPLIANCE','NARCOTIC_REGISTER'], hasDateRange: true, isRestricted: true, isNarcotic: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales/itemised?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','doctor','medicine','quantity','unitPrice'],
    headers: ['Sr. No.','Date','Patient','Age/Gender','IP No.','Ward/Bed','Doctor','Reg No.','Rx No.','Qty Prescribed','Qty Dispensed','Batch','Opening Bal','Closing Bal','Pharmacist']
  },
  {
    id: 'drug-license-compliance', category: 'compliance', name: 'Drug License Compliance Report',
    desc: 'All suppliers with DL expiry dates, flagging licenses expiring within 60 days',
    roles: ['SYSTEM_ADMIN','COMPLIANCE','SUPERVISOR'], hasDateRange: false, isRestricted: true,
    endpoint: () => pharmacyService.getSuppliers(),
    columns: ['name','supplierCode','drugLicenseNumber','drugLicenseExpiry','status'],
    headers: ['Supplier','Code','Drug License No.','Expiry Date','Status']
  },
  {
    id: 'user-activity-audit', category: 'compliance', name: 'User Activity Audit Report',
    desc: 'All user login/logout, transactions, adjustments, and approvals per user per shift',
    roles: ['SYSTEM_ADMIN'], hasDateRange: true, isRestricted: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','amount','status'],
    headers: ['Action','User','Date/Time','Details','Module']
  },

  // CLINICAL
  {
    id: 'prescription-fulfilment', category: 'clinical', name: 'Prescription Fulfilment Rate',
    desc: 'Percentage of prescription line items fully dispensed vs stockout',
    roles: ['SYSTEM_ADMIN','PHARMACIST'], hasDateRange: true,
    endpoint: (from, to) => pharmacyService.api.get(`/pharmacy/reports/sales?from=${from}&to=${to}`),
    columns: ['billNumber','date','patient','doctorName','amount','status'],
    headers: ['Bill No.','Date','Patient','Doctor','Amount','Status']
  },
];

export const CATEGORIES = [
  { id: 'all',        label: 'All Reports',              icon: LayoutGrid, color: 'text-slate-600' },
  { id: 'sales',      label: 'Sales',                    icon: TrendingUp, color: 'text-blue-600' },
  { id: 'stock',      label: 'Stock & Inventory',        icon: Package,    color: 'text-emerald-600' },
  { id: 'purchase',   label: 'Purchase & Supplier',      icon: ShoppingCart, color: 'text-cyan-600' },
  { id: 'gst',        label: 'Financial & GST',          icon: DollarSign, color: 'text-violet-600' },
  { id: 'compliance', label: 'Compliance & Regulatory',  icon: Shield,     color: 'text-purple-600' },
  { id: 'clinical',   label: 'Clinical',                 icon: Users,      color: 'text-rose-600' },
  { id: 'schedules',  label: 'Scheduled Reports',        icon: Bell,       color: 'text-amber-600' },
];

// ── DATE HELPERS ───────────────────────────────────────────────────────────────
const n = new Date();
export const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
export const monthStart = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
export const fmtDateTime    = (d) => d ? `${d}T00:00:00` : '';
export const fmtDateTimeEnd = (d) => d ? `${d}T23:59:59` : '';
export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`;
};

export const urgencyBadge = (u) => ({
  EXPIRED:     'bg-red-100 text-red-700 border border-red-200',
  CRITICAL:    'bg-red-50 text-red-600 border border-red-200',
  WARNING:     'bg-amber-50 text-amber-600 border border-amber-200',
  EARLY_ALERT: 'bg-blue-50 text-blue-600 border border-blue-200',
})[u] || 'bg-slate-100 text-slate-600';
