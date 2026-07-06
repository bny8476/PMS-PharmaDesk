import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { exportToCSV } from '../../utils/reportExport';

export default function MonthOverMonth() {
  const { dateRange } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMoMData();
  }, [dateRange]);

  const fetchMoMData = async () => {
    setLoading(true);
    try {
      const bEnd = new Date();
      const bStart = new Date();
      bStart.setMonth(bStart.getMonth() - 1);
      
      const aEnd = new Date(bStart);
      const aStart = new Date(bStart);
      aStart.setMonth(aStart.getMonth() - 1);
      
      const res = await api.get('/analytics/mom-comparison', {
        params: {
          monthAStart: aStart.toISOString(),
          monthAEnd: aEnd.toISOString(),
          monthBStart: bStart.toISOString(),
          monthBEnd: bEnd.toISOString()
        }
      });
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load Month-over-Month comparison data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading comparison...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const { monthA, monthB, revenueDifference, revenuePercentageChange } = data;
  const isPositive = revenueDifference >= 0;

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Revenue Comparison</h2>
          <p className="text-sm text-gray-500">{monthA.monthName} vs {monthB.monthName}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{monthA.monthName}</p>
            <p className="text-xl font-semibold text-gray-800">₹{monthA.totalRevenue?.toLocaleString()}</p>
          </div>
          <div className="text-gray-300">
            <Minus className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{monthB.monthName}</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center">
              ₹{monthB.totalRevenue?.toLocaleString()}
              <span className={`ml-3 flex items-center text-sm px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {revenuePercentageChange?.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800">{monthA.monthName} Top 10</h3>
            <button 
              onClick={() => exportToCSV({
                id: `top_10_${monthA.monthName}`,
                headers: ['Medicine', 'Sales Value'],
                columns: ['medicineName', 'totalSalesValue']
              }, monthA.top10Medicines)}
              className="text-xs text-blue-600 font-medium hover:text-blue-700"
            >
              Export
            </button>
          </div>
          <ul className="divide-y divide-gray-100 flex-1">
            {monthA.top10Medicines?.map((med, idx) => (
              <li key={idx} className="px-5 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{med.medicineName}</span>
                <span className="text-sm text-gray-900 font-semibold">₹{med.totalSalesValue?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800">{monthB.monthName} Top 10</h3>
            <button 
              onClick={() => exportToCSV({
                id: `top_10_${monthB.monthName}`,
                headers: ['Medicine', 'Sales Value'],
                columns: ['medicineName', 'totalSalesValue']
              }, monthB.top10Medicines)}
              className="text-xs text-blue-600 font-medium hover:text-blue-700"
            >
              Export
            </button>
          </div>
          <ul className="divide-y divide-gray-100 flex-1">
            {monthB.top10Medicines?.map((med, idx) => (
              <li key={idx} className="px-5 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{med.medicineName}</span>
                <span className="text-sm text-gray-900 font-semibold">₹{med.totalSalesValue?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
