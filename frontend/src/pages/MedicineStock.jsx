import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useShallow } from 'zustand/react/shallow';
import { Search, ChevronDown, ChevronRight, AlertTriangle, ShieldAlert, Package, CheckCircle, Printer, Download, Plus, RotateCcw, Box } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import AppModal from '../components/ui/AppModal';
import { toast } from 'react-hot-toast';
import { cn } from '../utils/cn';
import { useStockStore } from '../store/useStockStore';
import { useQuery } from '@tanstack/react-query';
import pharmacyService from '../utils/pharmacyService';

export default function MedicineStock() {
  const {
    stocks,
    medicines,
    valuation,
    suppliers,
    stockLoading: loading,
    fetchStocks,
    adjustStock,
    addStock,
    updateReorderConfig,
    runAutoPO
  } = useStockStore(useShallow(state => ({
    stocks: state.stocks,
    medicines: state.medicines,
    valuation: state.valuation,
    suppliers: state.suppliers,
    stockLoading: state.stockLoading,
    fetchStocks: state.fetchStocks,
    adjustStock: state.adjustStock,
    addStock: state.addStock,
    updateReorderConfig: state.updateReorderConfig,
    runAutoPO: state.runAutoPO
  })));

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [expandedMeds, setExpandedMeds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [activeTab, setActiveTab] = useState('Total Stock');

  const { data: movementRes, isLoading: isMovementLoading } = useQuery({
    queryKey: ['stockMovement'],
    queryFn: () => pharmacyService.getStockMovementInsights(),
  });
  const movementData = movementRes?.data || {};

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: 0, reason: 'Physical Count Correction', remarks: '' });

  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [addStockForm, setAddStockForm] = useState({
    medicineId: '', batchNumber: '', grnReference: '', manufacturingDate: '', expiryDate: '',
    quantityReceived: '', supplierId: '', purchaseRate: '', mrp: '', sellingRate: ''
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedConfigGroup, setSelectedConfigGroup] = useState(null);
  const [configForm, setConfigForm] = useState({ reorderLevel: 0, reorderQuantity: 0 });

  const toggleExpand = (medId) => {
    const newSet = new Set(expandedMeds);
    if (newSet.has(medId)) newSet.delete(medId);
    else newSet.add(medId);
    setExpandedMeds(newSet);
  };

  const handleAdjustSubmit = async () => {
    if (adjustForm.quantity === 0) return toast.error('Adjust quantity cannot be 0');
    const success = await adjustStock(selectedBatch.id, adjustForm.quantity, adjustForm.reason, adjustForm.remarks);
    if (success) {
      setIsAdjustModalOpen(false);
    }
  };

  const handleAddStockSubmit = async () => {
    if (!addStockForm.medicineId) return toast.error('Please select a Product SKU');
    if (!addStockForm.batchNumber) return toast.error('Batch number is required');
    if (!addStockForm.expiryDate) return toast.error('Expiry date is required');
    if (!addStockForm.quantityReceived || Number(addStockForm.quantityReceived) <= 0) return toast.error('Quantity received must be greater than 0');

    const payload = {
      medicine: { id: addStockForm.medicineId },
      batchNumber: addStockForm.batchNumber,
      grnReference: addStockForm.grnReference,
      manufacturingDate: addStockForm.manufacturingDate || null,
      expiryDate: addStockForm.expiryDate,
      quantityReceived: Number(addStockForm.quantityReceived),
      quantityAvailable: Number(addStockForm.quantityReceived), // initialize available with received
      purchaseRate: Number(addStockForm.purchaseRate) || 0,
      sellingRate: Number(addStockForm.sellingRate) || 0,
    };
    if (addStockForm.supplierId) {
      payload.supplier = { id: addStockForm.supplierId };
    }

    const success = await addStock(payload);
    if (success) {
      setIsAddStockModalOpen(false);
      setAddStockForm({
        medicineId: '', batchNumber: '', grnReference: '', manufacturingDate: '', expiryDate: '',
        quantityReceived: '', supplierId: '', purchaseRate: '', mrp: '', sellingRate: ''
      });
    }
  };

  const handleConfigSubmit = async () => {
    const payload = {
      ...selectedConfigGroup.medicine,
      reorderLevel: Number(configForm.reorderLevel),
      reorderQuantity: Number(configForm.reorderQuantity)
    };
    const success = await updateReorderConfig(payload.id, payload);
    if (success) setIsConfigModalOpen(false);
  };

  // Group stocks by medicine
  const groupedStocks = {};
  stocks.forEach(s => {
    if (!s.medicine) return;
    const mId = s.medicine.id;
    if (!groupedStocks[mId]) {
      groupedStocks[mId] = { medicine: s.medicine, batches: [], totalQty: 0 };
    }
    groupedStocks[mId].batches.push(s);
    groupedStocks[mId].totalQty += (s.quantityAvailable || 0);
  });

  // Convert to array and filter
  let medicineGroups = Object.values(groupedStocks).filter(group => {
    const s = debouncedSearch.toLowerCase();
    return !debouncedSearch || 
      group.medicine.name?.toLowerCase().includes(s) || 
      group.medicine.medicineCode?.toLowerCase().includes(s);
  });

  // Calculate Expiry Status dynamically
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Valid', color: 'success', days: 999 };
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Expired', color: 'danger', days };
    if (days <= 15) return { label: 'Critical', color: 'danger', days };
    if (days <= 30) return { label: 'Near Expiry', color: 'warning', days };
    if (days <= 60) return { label: 'Expiring Soon', color: 'warning', days };
    return { label: 'Healthy', color: 'success', days };
  };

  const paginatedGroups = pageSize === 'All' ? medicineGroups : medicineGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-medium tracking-tight text-slate-900">Stock Management</h2>
          <p className="text-sm text-slate-500 font-normal">Batch-level inventory tracking, auto-replenishment, and expiry monitoring.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsAddStockModalOpen(true)} className="px-4 py-2 bg-[#1a3c6e] text-white rounded-md text-sm font-medium hover:bg-[#1a3c6e]/90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Stock
          </button>
          <button onClick={runAutoPO} className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4" /> Run Auto-Reorder Check
          </button>
        </div>
      </div>

      {/* VALUATION KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Total Stock Value (Cost)</p>
          <p className="text-xl font-medium text-slate-900">₹{valuation?.totalPurchaseValue?.toLocaleString() || '0.00'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Total Stock Value (MRP)</p>
          <p className="text-xl font-medium text-slate-900">₹{valuation?.totalMrpValue?.toLocaleString() || '0.00'}</p>
        </div>
        <div className="bg-white border border-blue-200 bg-blue-50/30 rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wider mb-1">Moving Stock Value</p>
          <p className="text-xl font-medium text-blue-600">₹{movementData?.movingValue?.toLocaleString() || '0.00'}</p>
        </div>
        <div className="bg-white border border-slate-300 bg-slate-50/50 rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-medium text-slate-700 uppercase tracking-wider mb-1">Non-Moving Stock Value</p>
          <p className="text-xl font-medium text-slate-600">₹{movementData?.nonMovingValue?.toLocaleString() || '0.00'}</p>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider mb-1">Near Expiry Risk (&lt;30d)</p>
          <p className="text-xl font-medium text-amber-600">₹{valuation?.nearExpiryValue?.toLocaleString() || '0.00'}</p>
        </div>
        <div className="bg-white border border-red-200 bg-red-50/30 rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-medium text-red-700 uppercase tracking-wider mb-1">Expired Value (Write Off)</p>
          <p className="text-xl font-medium text-red-600">₹{valuation?.expiredValue?.toLocaleString() || '0.00'}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 flex gap-4 items-center shadow-sm">
        <div className="flex-1 max-w-sm">
          <ModuleFilterBar searchPlaceholder="Search..." onSearch={setSearchTerm} searchValue={searchTerm} hideDateRange={true} />
        </div>
        <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        {['Total Stock', 'Top Moving Stock', 'Top Non-Moving Stock'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors outline-none", 
              activeTab === tab ? "border-[#1a3c6e] text-[#1a3c6e]" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* BATCH LIST VIEW */}
      {activeTab === 'Total Stock' && (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading stock ledgers...</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1200px]">
            {/* Header */}
            <div className="grid grid-cols-[auto_60px_2fr_1.5fr_1.5fr_2fr_1fr_1fr] gap-4 p-4 border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-500 uppercase tracking-wider items-center min-w-[1200px]">
              <div className="w-6"></div> {/* Chevron placeholder */}
              <div className="text-center">S.No</div>
              <div>Medicine Info</div>
              <div>Drug Class</div>
              <div className="text-center">Total Stock</div>
              <div>Stock Health Status</div>
              <div className="text-center">Reorder Point</div>
              <div className="text-center">Actions</div>
            </div>

            {/* Rows */}
            {paginatedGroups.map(group => {
              const med = group.medicine;
              const isExpanded = expandedMeds.has(med.id);
              const reorderLvl = med.reorderLevel || 0;
              const isLowStock = group.totalQty <= reorderLvl;
              const healthPct = reorderLvl === 0 ? 100 : Math.min(100, (group.totalQty / reorderLvl) * 50); // 50% width means at reorder level
              
              // Sort batches by Expiry (FEFO)
              const sortedBatches = [...group.batches].sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));

              return (
                <React.Fragment key={med.id}>
                  {/* Medicine Row */}
                  <div className={cn("grid grid-cols-[auto_60px_2fr_1.5fr_1.5fr_2fr_1fr_1fr] gap-4 p-4 border-b border-slate-100 hover:bg-slate-50/80 transition-colors items-center cursor-pointer min-w-[1200px]", isLowStock ? "bg-red-50/20" : "")} onClick={() => toggleExpand(med.id)}>
                    <div className="w-6 flex justify-center">
                      <button className="p-1 text-slate-400 hover:text-slate-700 rounded">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-center text-sm font-medium text-slate-700">
                      {(currentPage - 1) * (pageSize === 'All' ? 0 : pageSize) + medicineGroups.indexOf(group) + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{med.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{med.medicineCode} - {med.category?.toLowerCase()} / {med.unit}</div>
                    </div>
                    <div className="text-sm text-slate-600">{med.drugClass || '-'}</div>
                    <div className="text-center flex flex-col items-center">
                      <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold", isLowStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                        {group.totalQty} {med.unit}
                      </span>
                      {med.unitsPerPack > 1 && (
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">= {group.totalQty * med.unitsPerPack} units</span>
                      )}
                    </div>
                    <div className="pr-4">
                      <div className="flex justify-between text-[10px] mb-1 font-medium">
                        <span className={isLowStock ? "text-red-500" : "text-emerald-500"}>Health: {healthPct.toFixed(0)}%</span>
                        <span className="text-slate-300">{isLowStock ? 'Low Stock' : 'Healthy'}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                        <div className={cn("h-full", isLowStock ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${healthPct}%` }} />
                      </div>
                    </div>
                    <div className="text-center text-sm text-slate-600">{reorderLvl} Units</div>
                    <div className="text-center">
                      <button className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md text-[11px] font-semibold hover:bg-slate-50 transition-colors" onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedConfigGroup(group);
                        setConfigForm({ reorderLevel: med.reorderLevel || 0, reorderQuantity: med.reorderQuantity || 0 });
                        setIsConfigModalOpen(true);
                      }}>
                        Config Reorder
                      </button>
                    </div>
                  </div>

                  {/* Expanded Batches */}
                  {isExpanded && (
                    <div className="col-span-full bg-slate-50/80 border-b border-slate-200 px-12 py-4">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                          <tr>
                            <th className="pb-3 font-medium">Batch No.</th>
                            <th className="pb-3 font-medium">Expiry Date</th>
                            <th className="pb-3 font-medium text-right">Available Qty</th>
                            <th className="pb-3 font-medium text-right">Purchase / MRP</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedBatches.map(b => {
                            const exp = getExpiryStatus(b.expiryDate);
                            return (
                              <tr key={b.id} className="hover:bg-white transition-colors">
                                <td className="py-3 font-mono text-slate-700">{b.batchNumber}</td>
                                <td className="py-3 text-slate-700 flex items-center gap-2">
                                  {b.expiryDate} 
                                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", 
                                    exp.color === 'danger' ? 'bg-red-100 text-red-700' : 
                                    exp.color === 'warning' ? 'bg-amber-100 text-amber-700' : 'text-slate-400'
                                  )}>{exp.days}d</span>
                                </td>
                                <td className="py-3 text-right font-medium">{b.quantityAvailable}</td>
                                <td className="py-3 text-right">₹{b.purchaseRate} / ₹{b.sellingRate}</td>
                                <td className="py-3">
                                  <Badge variant={exp.color}>{exp.label}</Badge>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => window.print()} className="p-1.5 text-slate-400 hover:text-slate-600" title="Print Labels">
                                      <Printer className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setSelectedBatch(b); setAdjustForm({...adjustForm, quantity: 0}); setIsAdjustModalOpen(true); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md text-[11px] font-semibold hover:bg-slate-50 transition-colors">
                                      Adjust
                                    </button>
                                    {exp.color === 'danger' && (
                                      <>
                                        <button className="px-3 py-1.5 bg-amber-500 text-white rounded-md text-[11px] font-semibold hover:bg-amber-600 transition-colors">Return</button>
                                        <button className="px-3 py-1.5 bg-red-600 text-white rounded-md text-[11px] font-semibold hover:bg-red-700 transition-colors">Write Off</button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            </div>
          </div>
        )}
        <Pagination totalRecords={medicineGroups.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>
      )}

      {activeTab === 'Top Moving Stock' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {isMovementLoading ? (
            <div className="p-8 text-center text-slate-500">Loading moving stock insights...</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200/60 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Medicine Name</th>
                    <th className="px-6 py-4 font-medium text-right">Units Sold (30d)</th>
                    <th className="px-6 py-4 font-medium text-right">Sales Value</th>
                    <th className="px-6 py-4 font-medium text-right">Current Stock</th>
                    <th className="px-6 py-4 font-medium text-center">Days Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movementData?.topMoving?.map(med => (
                    <tr key={med.medicineId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{med.medicineName}</div>
                        <div className="text-xs text-slate-500">{med.drugClass}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{med.totalUnitsDispensed}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">₹{med.totalSalesValue?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-medium">{med.currentStockLevel}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={med.reorderRecommendation ? 'danger' : 'success'}>
                          {med.daysOfStockRemaining} Days
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {!movementData?.topMoving?.length && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No data available for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Top Non-Moving Stock' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {isMovementLoading ? (
            <div className="p-8 text-center text-slate-500">Loading non-moving stock insights...</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200/60 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Medicine Name</th>
                    <th className="px-6 py-4 font-medium text-right">Units Sold (30d)</th>
                    <th className="px-6 py-4 font-medium text-right">Capital Locked</th>
                    <th className="px-6 py-4 font-medium text-right">Current Stock</th>
                    <th className="px-6 py-4 font-medium text-center">Last Dispensed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...(movementData?.topNonMoving || [])]
                    .sort((a, b) => (b.stockValueLocked || 0) - (a.stockValueLocked || 0))
                    .map(med => (
                    <tr key={med.medicineId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{med.medicineName}</div>
                        <div className="text-xs text-slate-500">{med.drugClass}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{med.totalUnitsDispensed}</td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">₹{med.stockValueLocked?.toLocaleString() || '0.00'}</td>
                      <td className="px-6 py-4 text-right font-medium">{med.currentStockLevel}</td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {med.lastDispensedDate ? new Date(med.lastDispensedDate).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                  {!movementData?.topNonMoving?.length && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No data available for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      <AppModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Stock Quantity"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex w-full gap-3">
            <button onClick={() => setIsAdjustModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={handleAdjustSubmit} className="flex-1 px-4 py-2 bg-[#1a3c6e] text-white rounded-md text-sm font-medium">Confirm Adjustment</button>
          </div>
        }
      >
        {selectedBatch && (
          <div className="space-y-4 p-2">
            <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm">
              <p><span className="text-slate-500">Medicine:</span> <span className="font-medium">{selectedBatch.medicine?.name}</span></p>
              <p><span className="text-slate-500">Batch:</span> <span className="font-mono">{selectedBatch.batchNumber}</span></p>
              <p><span className="text-slate-500">Current Qty:</span> <span className="font-medium">{selectedBatch.quantityAvailable}</span></p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Adjustment Quantity (+/-)</label>
              <input type="number" value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-blue-500" />
              <p className="text-xs text-slate-500">Use negative numbers to deduct stock (e.g. -5 for damage).</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Reason</label>
              <select value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none">
                <option>Physical Count Correction</option>
                <option>Damage / Breakage</option>
                <option>Theft / Loss</option>
                <option>Sample / Internal Use</option>
                <option>Expiry Write-Off</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Remarks (Optional)</label>
              <textarea value={adjustForm.remarks} onChange={e => setAdjustForm({...adjustForm, remarks: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none h-20 resize-none"></textarea>
            </div>
          </div>
        )}
      </AppModal>

      {/* Register Stock Inward Modal */}
      <AppModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        title="Register Stock Inward"
        maxWidth="sm:max-w-3xl"
        footer={
          <div className="flex w-full gap-3">
            <button onClick={() => setIsAddStockModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={handleAddStockSubmit} className="flex-1 px-4 py-2 bg-[#1a3c6e] text-white rounded-md text-sm font-medium flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Save Inward Batch
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-2">
          {/* Row 1 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Select Product SKU <span className="text-amber-500">*</span></label>
            <select value={addStockForm.medicineId} onChange={e => setAddStockForm({...addStockForm, medicineId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]">
              <option value="">Choose a medicine from Master Registry...</option>
              {medicines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.medicineCode})</option>
              ))}
            </select>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Batch Number <span className="text-amber-500">*</span></label>
              <input type="text" placeholder="e.g. BTCH-10294" value={addStockForm.batchNumber} onChange={e => setAddStockForm({...addStockForm, batchNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">GRN Reference Number</label>
              <input type="text" placeholder="GRN-6405" value={addStockForm.grnReference} onChange={e => setAddStockForm({...addStockForm, grnReference: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Manufacturing Date</label>
              <input type="date" value={addStockForm.manufacturingDate} onChange={e => setAddStockForm({...addStockForm, manufacturingDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Expiry Date <span className="text-amber-500">*</span></label>
              <input type="date" value={addStockForm.expiryDate} onChange={e => setAddStockForm({...addStockForm, expiryDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Quantity Received <span className="text-amber-500">*</span></label>
              <input type="number" placeholder="100" value={addStockForm.quantityReceived} onChange={e => setAddStockForm({...addStockForm, quantityReceived: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Preferred Supplier Name</label>
              <select value={addStockForm.supplierId} onChange={e => setAddStockForm({...addStockForm, supplierId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]">
                <option value="">Select a supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Purchase Cost (Unit)</label>
              <input type="number" step="0.01" placeholder="8.5" value={addStockForm.purchaseRate} onChange={e => setAddStockForm({...addStockForm, purchaseRate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">MRP (Unit)</label>
              <input type="number" step="0.01" placeholder="15" value={addStockForm.mrp} onChange={e => setAddStockForm({...addStockForm, mrp: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Selling Rate (Unit)</label>
              <input type="number" step="0.01" placeholder="12" value={addStockForm.sellingRate} onChange={e => setAddStockForm({...addStockForm, sellingRate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
          </div>
        </div>
      </AppModal>

      {/* Configure Reorder Points Modal */}
      <AppModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Reorder Points"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex w-full gap-3">
            <button onClick={() => setIsConfigModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={handleConfigSubmit} className="flex-1 px-4 py-2 bg-[#1a3c6e] text-white rounded-md text-sm font-medium">Save Settings</button>
          </div>
        }
      >
        {selectedConfigGroup && (
          <div className="space-y-4 p-2">
            <div className="bg-slate-50 p-4 rounded-md border border-slate-100 space-y-1">
              <p className="font-semibold text-slate-700">{selectedConfigGroup.medicine?.name}</p>
              <p className="text-sm text-slate-500">Total Stock Available: {selectedConfigGroup.totalQty} Units</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Reorder Point (Min Stock Threshold)</label>
              <input type="number" value={configForm.reorderLevel} onChange={e => setConfigForm({...configForm, reorderLevel: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Reorder Quantity (Standard Restock Order)</label>
              <input type="number" value={configForm.reorderQuantity} onChange={e => setConfigForm({...configForm, reorderQuantity: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-[#1a3c6e]" />
            </div>
          </div>
        )}
      </AppModal>

    </div>
  );
}
