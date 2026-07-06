import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import { TrendingUp, TrendingDown, IndianRupee, Package, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { exportToCSV } from '../../utils/reportExport';

export default function AnalyticsDashboard() {
  const { dateRange } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // For now, hardcode start and end dates. In a real app, calculate them from `dateRange`.
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const end = new Date();
      
      const res = await api.get('/analytics/dashboard-summary', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const KPICard = ({ title, dataObj, icon: Icon, prefix = '', suffix = '' }) => {
    if (!dataObj) return null;
    const { currentValue, percentageChange, positive } = dataObj;
    
    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="p-2 bg-gray-50 rounded text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <h3 className="text-2xl font-semibold text-gray-800">
            {prefix}{currentValue?.toLocaleString()}{suffix}
          </h3>
          <span className={`flex items-center text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {percentageChange?.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sales Revenue" dataObj={data.totalSalesRevenue} icon={IndianRupee} prefix="₹" />
        <KPICard title="Total Purchases" dataObj={data.totalPurchases} icon={Package} prefix="₹" />
        <KPICard title="Estimated Profit Margin" dataObj={data.estimatedProfitMargin} icon={TrendingUp} suffix="%" />
        <KPICard title="Net Revenue" dataObj={data.netRevenue} icon={TrendingUp} prefix="₹" />
        <KPICard title="Total Units Dispensed" dataObj={data.totalUnitsDispensed} icon={Package} />
        <KPICard title="Total Transactions" dataObj={data.totalTransactions} icon={Activity} />
        <KPICard title="Avg Transaction Value" dataObj={data.averageTransactionValue} icon={IndianRupee} prefix="₹" />
        <KPICard title="Total Returns Value" dataObj={data.totalReturnsValue} icon={AlertTriangle} prefix="₹" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Revenue & Units Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={Array.isArray(data.revenueTrend) ? data.revenueTrend : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(v) => `₹${v}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="unitsDispensed" name="Units" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fast Moving */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              Fast-Moving Medicines
            </h3>
            <button 
              onClick={() => exportToCSV({
                id: 'fast_moving_medicines',
                headers: ['Medicine', 'Class', 'Units Dispensed', 'Value'],
                columns: ['medicineName', 'drugClass', 'totalUnitsDispensed', 'totalSalesValue']
              }, data.fastMovingMedicines)}
              className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-md"
            >
              <Download className="w-4 h-4 mr-1"/> Export
            </button>
          </div>
          <div className="space-y-4">
            {data.fastMovingMedicines?.map((med, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{med.medicineName}</p>
                  <p className="text-xs text-gray-500">{med.drugClass}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{med.totalUnitsDispensed} units</p>
                  <p className="text-xs text-green-600 font-medium">₹{med.totalSalesValue?.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {data.fastMovingMedicines?.length === 0 && (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Slow Moving */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center">
            <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
            Slow-Moving Medicines (Action Required)
          </h3>
          <button 
            onClick={() => exportToCSV({
              id: 'slow_moving_medicines',
              headers: ['Medicine', 'Class', 'Units Dispensed', 'Current Stock', 'Value Locked'],
              columns: ['medicineName', 'drugClass', 'totalUnitsDispensed', 'currentStockLevel', 'totalSalesValue']
            }, data.slowMovingMedicines)}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-md"
          >
            <Download className="w-4 h-4 mr-1"/> Export to CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units Dispensed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value Locked</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slowMovingMedicines?.map((med, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{med.medicineName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{med.drugClass}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">{med.totalUnitsDispensed}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">{med.currentStockLevel}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-amber-600">₹{med.stockValueLocked?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Dead Stock
                    </span>
                  </td>
                </tr>
              ))}
              {data.slowMovingMedicines?.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">No slow moving medicines found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
