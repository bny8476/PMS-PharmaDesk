import api from './api';

const pharmacyService = {
  // Dashboard API calls moved to React Query within components

  // Sales
  getSales: async () => {
    const response = await api.get('/pharmacy/sales');
    return response.data;
  },
  getSaleByNumber: async (billNumber) => {
    const response = await api.get(`/pharmacy/sales/number/${billNumber}`);
    return response.data;
  },
  createSale: async (saleData) => {
    const response = await api.post('/pharmacy/sales', saleData);
    return response.data;
  },
  deleteSale: async (id) => {
    const response = await api.delete(`/pharmacy/sales/${id}`);
    return response.data;
  },

  // Returns
  getPendingReturns: async () => {
    const response = await api.get('/pharmacy/returns/pending');
    return response.data;
  },
  getAllReturns: async () => {
    const response = await api.get('/pharmacy/returns');
    return response.data;
  },
  initiateReturn: async (billId, items, reason) => {
    const response = await api.post(`/pharmacy/returns/initiate/${billId}?reason=${reason}`, items);
    return response.data;
  },
  approveReturn: async (id) => {
    const response = await api.post(`/pharmacy/returns/${id}/approve`);
    return response.data;
  },
  rejectReturn: async (id) => {
    const response = await api.post(`/pharmacy/returns/${id}/reject`);
    return response.data;
  },

  // Credit Bills
  getCreditBills: async () => {
    const response = await api.get('/pharmacy/credit-bills');
    return response.data;
  },
  addCreditPayment: async (id, amount, mode, reference) => {
    const response = await api.post(`/pharmacy/credit-bills/${id}/payment?amount=${amount}&mode=${mode}&reference=${reference || ''}`);
    return response.data;
  },

  // Search
  searchStocks: async (name) => {
    const response = await api.get(`/pharmacy/stocks/search?name=${name}`);
    return response.data;
  },
  getAllStocks: async () => {
    const response = await api.get('/pharmacy/stocks');
    return response.data;
  },
  getStockMovementInsights: async (params = {}) => {
    const { startDate, endDate, limit } = params;
    let url = '/analytics/stocks/movement';
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (limit) query.append('limit', limit);
    if (query.toString()) url += `?${query.toString()}`;
    const response = await api.get(url);
    return response.data;
  },
  addStock: async (stockData) => {
    const response = await api.post('/pharmacy/stocks', stockData);
    return response.data;
  },
  getStockByBarcode: async (barcode) => {
    const response = await api.get(`/pharmacy/stocks/barcode/${barcode}`);
    return response.data;
  },
  searchPatients: async (query) => {
    const response = await api.get(`/pharmacy/patients/search?query=${query}`);
    return response.data;
  },
  
  // Advances
  getAllAdvances: async () => {
    const response = await api.get('/pharmacy/advances');
    return response.data;
  },
  addAdvance: async (patientName, amount, patientId) => {
    const response = await api.post(`/pharmacy/advances?patientName=${patientName}&amount=${amount}${patientId ? `&patientId=${patientId}` : ''}`);
    return response.data;
  },

  // Prescriptions
  getPendingPrescriptions: async () => {
    const response = await api.get('/pharmacy/prescriptions/pending');
    return response.data;
  },
  // Medicine Master
  getMedicines: async () => {
    const response = await api.get('/pharmacy/medicines');
    return response.data;
  },
  createMedicine: async (medicineData) => {
    const response = await api.post('/pharmacy/medicines', medicineData);
    return response.data;
  },
  updateMedicine: async (id, medicineData) => {
    const response = await api.put(`/pharmacy/medicines/${id}`, medicineData);
    return response.data;
  },
  deleteMedicine: async (id) => {
    const response = await api.delete(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  // Suppliers
  getSuppliers: async () => {
    const response = await api.get('/pharmacy/suppliers');
    return response.data;
  },
  createSupplier: async (data) => {
    const response = await api.post('/pharmacy/suppliers', data);
    return response.data;
  },
  updateSupplier: async (id, data) => {
    const response = await api.put(`/pharmacy/suppliers/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id) => {
    const response = await api.delete(`/pharmacy/suppliers/${id}`);
    return response.data;
  },
  getSupplier: async (id) => {
    const response = await api.get(`/pharmacy/suppliers/${id}`);
    return response.data;
  },
  getSupplierPerformance: async (id) => {
    const response = await api.get(`/pharmacy/suppliers/${id}/performance`);
    return response.data;
  },
  saveSupplierPerformance: async (id, data) => {
    const response = await api.post(`/pharmacy/suppliers/${id}/performance`, data);
    return response.data;
  },

  // GRN
  getGrns: async () => {
    const response = await api.get('/pharmacy/grns');
    return response.data;
  },
  getGrnsBySupplier: async (supplierId) => {
    const response = await api.get(`/pharmacy/grns/supplier/${supplierId}`);
    return response.data;
  },
  getGrnsByPo: async (poId) => {
    const response = await api.get(`/pharmacy/grns/po/${poId}`);
    return response.data;
  },
  getGrn: async (id) => {
    const response = await api.get(`/pharmacy/grns/${id}`);
    return response.data;
  },
  createGrn: async (data) => {
    const response = await api.post('/pharmacy/grns', data);
    return response.data;
  },
  confirmGrn: async (id) => {
    const response = await api.post(`/pharmacy/grns/${id}/confirm`);
    return response.data;
  },

  // Supplier Invoices
  getSupplierInvoices: async () => {
    const response = await api.get('/pharmacy/supplier-invoices');
    return response.data;
  },
  getSupplierInvoicesBySupplier: async (supplierId) => {
    const response = await api.get(`/pharmacy/supplier-invoices/supplier/${supplierId}`);
    return response.data;
  },
  getSupplierInvoice: async (id) => {
    const response = await api.get(`/pharmacy/supplier-invoices/${id}`);
    return response.data;
  },
  createSupplierInvoice: async (data) => {
    const response = await api.post('/pharmacy/supplier-invoices', data);
    return response.data;
  },
  matchSupplierInvoice: async (id) => {
    const response = await api.post(`/pharmacy/supplier-invoices/${id}/match`);
    return response.data;
  },
  updateSupplierInvoiceStatus: async (id, status) => {
    const response = await api.put(`/pharmacy/supplier-invoices/${id}/status?status=${status}`);
    return response.data;
  },
  getOutstandingBalance: async (supplierId) => {
    const response = await api.get(`/pharmacy/supplier-invoices/supplier/${supplierId}/outstanding`);
    return response.data;
  },

  // Supplier Returns
  getSupplierReturns: async () => {
    const response = await api.get('/pharmacy/supplier-returns');
    return response.data;
  },
  getSupplierReturnsBySupplier: async (supplierId) => {
    const response = await api.get(`/pharmacy/supplier-returns/supplier/${supplierId}`);
    return response.data;
  },
  createSupplierReturn: async (data) => {
    const response = await api.post('/pharmacy/supplier-returns', data);
    return response.data;
  },
  updateSupplierReturnStatus: async (id, status, creditNoteNumber, actualCreditValue) => {
    let url = `/pharmacy/supplier-returns/${id}/status?status=${status}`;
    if (creditNoteNumber) url += `&creditNoteNumber=${creditNoteNumber}`;
    if (actualCreditValue) url += `&actualCreditValue=${actualCreditValue}`;
    const response = await api.put(url);
    return response.data;
  },

  // Patients
  getPatients: async () => {
    const response = await api.get('/pharmacy/patients');
    return response.data;
  },
  createPatient: async (data) => {
    const response = await api.post('/pharmacy/patients', data);
    return response.data;
  },
  updatePatient: async (id, data) => {
    const response = await api.put(`/pharmacy/patients/${id}`, data);
    return response.data;
  },
  deletePatient: async (id) => {
    const response = await api.delete(`/pharmacy/patients/${id}`);
    return response.data;
  },

  // Reports
  // Reports
  getSalesReport: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/sales?from=${from}&to=${to}`);
    return response.data;
  },
  getDailySalesSummary: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/sales/summary?from=${from}&to=${to}`);
    return response.data;
  },
  getItemisedSalesRegister: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/sales/itemised?from=${from}&to=${to}`);
    return response.data;
  },
  getMedicineWiseSales: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/sales/medicine-wise?from=${from}&to=${to}`);
    return response.data;
  },
  getCreditSalesReport: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/sales/credit?from=${from}&to=${to}`);
    return response.data;
  },
  getCancelledBillsReport: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/sales/cancelled?from=${from}&to=${to}`);
    return response.data;
  },
  getTaxReport: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/tax?from=${from}&to=${to}`);
    return response.data;
  },
  getGstSalesRegister: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/gst/sales?from=${from}&to=${to}`);
    return response.data;
  },
  getStockReport: async () => {
    const response = await api.get('/pharmacy/reports/stock');
    return response.data;
  },
  getExpiryReport: async (days) => {
    const response = await api.get(`/pharmacy/reports/stock/expiry?days=${days}`);
    return response.data;
  },
  getSlowMovingReport: async (from, to, threshold = 5) => {
    const response = await api.get(`/pharmacy/reports/stock/slow-moving?from=${from}&to=${to}&threshold=${threshold}`);
    return response.data;
  },
  getPurchaseRegister: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/purchase/register?from=${from}&to=${to}`);
    return response.data;
  },
  getOutstandingPayables: async () => {
    const response = await api.get('/pharmacy/reports/purchase/payables');
    return response.data;
  },
  getSupplierPerformanceReport: async () => {
    const response = await api.get('/pharmacy/reports/supplier/performance');
    return response.data;
  },

  // Report Schedules
  getReportSchedules: async () => {
    const response = await api.get('/pharmacy/report-schedules');
    return response.data;
  },
  createReportSchedule: async (data) => {
    const response = await api.post('/pharmacy/report-schedules', data);
    return response.data;
  },
  updateReportSchedule: async (id, data) => {
    const response = await api.put(`/pharmacy/report-schedules/${id}`, data);
    return response.data;
  },
  toggleReportSchedule: async (id) => {
    const response = await api.patch(`/pharmacy/report-schedules/${id}/toggle`);
    return response.data;
  },
  // OTP
  sendOtp: async (email) => {
    const response = await api.post('/auth/otp/send', { email });
    return response.data;
  },
  verifyOtp: async (email, code) => {
    const response = await api.post('/auth/otp/verify', { email, code });
    return response.data;
  },

  // Narcotic Register
  getNarcoticRegister: async (medicineId, from, to) => {
    const response = await api.get(`/pharmacy/narcotic-register?medicineId=${medicineId}&from=${from}&to=${to}`);
    return response.data;
  },
  createNarcoticEntry: async (data) => {
    const response = await api.post('/pharmacy/narcotic-register/entry', data);
    return response.data;
  },
  getNarcoticMonthlyReconciliation: async (medicineId, month, year) => {
    const response = await api.get(`/pharmacy/narcotic-register/monthly-reconciliation?medicineId=${medicineId}&month=${month}&year=${year}`);
    return response.data;
  },
  // Expiry & Batch Tracker
  getExpiryBatches: async () => {
    const response = await api.get('/expiry-tracker/batches');
    return response.data;
  },
  getExpirySummary: async () => {
    const response = await api.get('/expiry-tracker/summary');
    return response.data;
  },
  initiateExpiryReturn: async (data) => {
    const response = await api.post('/expiry-tracker/return', data);
    return response.data;
  },
  getExpiryReturns: async () => {
    const response = await api.get('/expiry-tracker/returns');
    return response.data;
  },

  // POs
  getPOs: async () => {
    const response = await api.get('/pharmacy/purchase-orders');
    return response.data;
  },
  createPO: async (data) => {
    const response = await api.post('/pharmacy/purchase-orders', data);
    return response.data;
  },
  submitPO: async (id) => {
    const response = await api.put(`/pharmacy/purchase-orders/${id}/submit`);
    return response.data;
  },
  approvePO: async (id, userId) => {
    const response = await api.put(`/pharmacy/purchase-orders/${id}/approve?userId=${userId}`);
    return response.data;
  },
  sendPO: async (id) => {
    const response = await api.put(`/pharmacy/purchase-orders/${id}/send`);
    return response.data;
  },
  cancelPO: async (id, reason, userId) => {
    const response = await api.put(`/pharmacy/purchase-orders/${id}/cancel?reason=${reason}&userId=${userId}`);
    return response.data;
  },
  getPOSummary: async () => {
    const response = await api.get('/pharmacy/purchase-orders/summary');
    return response.data;
  },

  // Cold Chain
  getStorageUnits: async () => {
    const response = await api.get('/pharmacy/temperature-logs/units');
    return response.data;
  },
  createStorageUnit: async (data) => {
    const response = await api.post('/pharmacy/temperature-logs/units', data);
    return response.data;
  },
  recordTemperature: async (data) => {
    const response = await api.post('/pharmacy/temperature-logs', data);
    return response.data;
  },
  recordCorrectiveAction: async (id, action, userId) => {
    const response = await api.post(`/pharmacy/temperature-logs/${id}/resolve?action=${action}&userId=${userId}`);
    return response.data;
  },
  getTemperatureBreaches: async () => {
    const response = await api.get('/pharmacy/temperature-logs/breaches');
    return response.data;
  },
  getTemperatureChart: async (unitId) => {
    const response = await api.get(`/pharmacy/temperature-logs/chart/${unitId}`);
    return response.data;
  },

  // Drug Interactions
  checkDrugInteractions: async (medicineIds) => {
    const response = await api.post('/drug-interactions/check', medicineIds);
    return response.data;
  },
  getDrugInteractionIncidentReport: async () => {
    const response = await api.get('/drug-interactions/incident-report');
    return response.data;
  },

  // Barcode
  scanBarcode: async (barcodeValue, scanModule, userId) => {
    const response = await api.post(`/pharmacy/barcode/scan?userId=${userId}`, { barcodeValue, scanModule });
    return response.data;
  },

  // Insurance Claims
  getInsuranceClaims: async () => {
    const response = await api.get('/insurance-claims');
    return response.data;
  },
  createInsuranceClaim: async (data) => {
    const response = await api.post('/insurance-claims', data);
    return response.data;
  },
  updateInsuranceClaimStatus: async (id, status) => {
    const response = await api.put(`/insurance-claims/${id}/status?status=${status}`);
    return response.data;
  },
  getInsuranceProviders: async () => {
    const response = await api.get('/insurance-claims/providers');
    return response.data;
  },
  createInsuranceProvider: async (data) => {
    const response = await api.post('/insurance-claims/providers', data);
    return response.data;
  },

  api
};

export default pharmacyService;
