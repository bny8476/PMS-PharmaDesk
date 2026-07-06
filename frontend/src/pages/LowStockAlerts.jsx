import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import TableSkeleton from '../components/ui/TableSkeleton';
import ErrorBanner from '../components/ui/ErrorBanner';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useStockStore } from '../store/useStockStore';

export default function LowStockAlerts() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const {
    lowStockItems: items,
    lowStockLoading: isLoading,
    lowStockError: isError,
    lowStockFetching: isFetching,
    lowStockPage: page,
    lowStockTotalElements: totalElements,
    setLowStockPage: goToPage,
    fetchLowStockAlerts: refetch
  } = useStockStore(useShallow(state => ({
    lowStockItems: state.lowStockItems,
    lowStockLoading: state.lowStockLoading,
    lowStockError: state.lowStockError,
    lowStockFetching: state.lowStockFetching,
    lowStockPage: state.lowStockPage,
    lowStockTotalElements: state.lowStockTotalElements,
    setLowStockPage: state.setLowStockPage,
    fetchLowStockAlerts: state.fetchLowStockAlerts
  })));

  // Fetch initially
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time polling every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch(true).then(() => {
        setLastUpdated(new Date());
      }).catch(() => {
        console.warn('Low stock polling failed');
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refetch]);

  const handleManualRefresh = () => {
    refetch(true).then(() => {
      setLastUpdated(new Date());
      toast.success('Data refreshed successfully');
    }).catch(() => {
      toast.error('Failed to refresh data');
    });
  };

  const columns = [
    { header: 'Medicine Name', accessor: 'medicineName' },
    { header: 'Category', accessor: 'category' },
    { 
      header: 'Current Stock', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.currentStock}</span>
          {row.unitsPerPack > 1 && (
            <span className="text-[10px] text-slate-500 mt-0.5">= {row.currentStock * row.unitsPerPack} units</span>
          )}
        </div>
      )
    },
    { header: 'Reorder Level', accessor: 'reorderLevel' },
    { header: 'Unit', accessor: 'unit' },
    { header: 'Supplier', accessor: 'supplierName' },
    { header: 'Last Restocked', render: (row) => new Date(row.lastUpdated || Date.now()).toLocaleDateString('en-IN') }
  ];

  // Helper to color code rows
  const getRowClassName = (row) => {
    if (row.currentStock === 0) return 'bg-red-50 hover:bg-red-100 text-red-900 border-l-4 border-red-500';
    if (row.currentStock <= row.reorderLevel) return 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-l-4 border-orange-400';
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Low Stock Alerts
          </h2>
          <p className="text-sm text-gray-500 font-medium">Items that need to be reordered soon</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <Clock className="w-4 h-4" />
            Last updated: <span className="text-gray-900 font-bold">{lastUpdated.toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          <button 
            onClick={handleManualRefresh} 
            disabled={isFetching}
            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isError ? (
          <div className="p-6">
            <ErrorBanner onRetry={refetch} />
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : !isLoading && !isError && items.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-semibold flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <Badge variant="success" className="p-2 border-0 shadow-none">
                <AlertTriangle className="w-8 h-8 text-green-500" />
              </Badge>
            </div>
            <p className="text-lg">All caught up!</p>
            <p className="text-sm font-normal mt-1">There are no low stock items right now.</p>
          </div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={items} 
              hover 
              rowClassName={getRowClassName}
            />
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
    </div>
  );
}
