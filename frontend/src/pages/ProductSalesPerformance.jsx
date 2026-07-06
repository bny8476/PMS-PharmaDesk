import React, { useState, useMemo } from 'react';
import useDebounce from '../hooks/useDebounce';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Loader2, Info, Download } from 'lucide-react';
import { exportToCSV } from '../utils/reportExport';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths } from 'date-fns';

const TABS = [
  { id: 'landing', label: 'Analytics Landing' },
  { id: 'velocity', label: 'Velocity (Fast/Slow)' },
  { id: 'abc', label: 'ABC Analysis' },
  { id: 'mom', label: 'Month Comparison (MoM)' },
  { id: 'categories', label: 'Categories & Suppliers' },
  { id: 'wards', label: 'Clinical Patterns & Wards' },
  { id: 'reports', label: 'Efficiency & Reports' }
];

const getDateRange = (filter) => {
  const now = new Date();
  switch(filter) {
    case 'Today': return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
    case 'This Week': return { start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), end: endOfWeek(now, { weekStartsOn: 1 }).toISOString() };
    case 'This Month': return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
    case 'This Quarter': return { start: startOfQuarter(now).toISOString(), end: endOfQuarter(now).toISOString() };
    default: return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
  }
};

export default function ProductSalesPerformance() {
  const [activeTab, setActiveTab] = useState('landing');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { start, end } = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  // Query 1: Dashboard Summary
  const { data: dashboardData, isLoading: loadingDash } = useQuery({
    queryKey: ['analytics', 'dashboard', start, end],
    queryFn: async () => {
      const res = await api.get(`/analytics/dashboard-summary?startDate=${start}&endDate=${end}`);
      return res.data?.data;
    },
    enabled: activeTab === 'landing' || activeTab === 'velocity'
  });

  // Query 2: ABC Analysis
  const { data: abcData, isLoading: loadingAbc } = useQuery({
    queryKey: ['analytics', 'abc', start, end],
    queryFn: async () => {
      const res = await api.get(`/analytics/abc-analysis?startDate=${start}&endDate=${end}`);
      return res.data?.data;
    },
    enabled: activeTab === 'abc'
  });

  // Query 3: Month Over Month
  const { start: monthBStart, end: monthBEnd } = useMemo(() => getDateRange('This Month'), []);
  const monthAStart = useMemo(() => startOfMonth(subMonths(new Date(), 1)).toISOString(), []);
  const monthAEnd = useMemo(() => endOfMonth(subMonths(new Date(), 1)).toISOString(), []);
  
  const { data: momData, isLoading: loadingMom } = useQuery({
    queryKey: ['analytics', 'mom', monthAStart, monthBEnd],
    queryFn: async () => {
      const res = await api.get(`/analytics/mom-comparison?monthAStart=${monthAStart}&monthAEnd=${monthAEnd}&monthBStart=${monthBStart}&monthBEnd=${monthBEnd}`);
      return res.data?.data;
    },
    enabled: activeTab === 'mom'
  });

  const KPICard = ({ title, data, format = 'currency' }) => {
    if (!data) return null;
    const { currentValue, previousValue, percentageChange, positiveTrend } = data;
    const Icon = positiveTrend ? ArrowUpRight : ArrowDownRight;
    const trendColor = positiveTrend ? 'text-emerald-500' : 'text-red-500';
    
    let displayValue = currentValue;
    let prevDisplay = previousValue;
    
    if (format === 'currency') {
      displayValue = `₹${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      prevDisplay = `₹${previousValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (format === 'units') {
      displayValue = `${currentValue.toLocaleString()} Units`;
      prevDisplay = `${previousValue.toLocaleString()}`;
    } else if (format === 'invoices') {
      displayValue = `${currentValue.toLocaleString()} Invoices`;
      prevDisplay = `${previousValue.toLocaleString()}`;
    }

    return (
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">{title}</p>
        <h3 className={`text-2xl font-black tracking-tight mb-3 ${format === 'currency' && !positiveTrend && percentageChange > 0 ? 'text-red-600' : 'text-slate-800'}`}>
          {displayValue}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-medium">Prev: {prevDisplay}</span>
          <span className={`flex items-center font-bold ${trendColor}`}>
            <Icon className="w-3 h-3" /> {percentageChange.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const renderLanding = () => {
    if (loadingDash) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!dashboardData) return null;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard title="Total Sales Revenue" data={dashboardData.totalSalesRevenue} />
          <KPICard title="Total Units Dispensed" data={dashboardData.totalUnitsDispensed} format="units" />
          <KPICard title="Transactions" data={dashboardData.totalTransactions} format="invoices" />
          <KPICard title="Avg Ticket Value" data={dashboardData.averageTransactionValue} />
          <KPICard title="Credit Notes Value" data={dashboardData.totalReturnsValue} />
          <KPICard title="Net Pharmacy Revenue" data={dashboardData.netRevenue} />
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">Revenue Trend ({dateFilter})</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.revenueTrend || []} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} tickFormatter={(value) => value === 0 ? '0' : value} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Sales Revenue (₹)" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }} />
                <Line yAxisId="left" type="monotone" dataKey="unitsDispensed" name="Units Sold" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderVelocity = () => {
    if (loadingDash) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    const fast = dashboardData?.fastMovingMedicines || [];
    const slow = dashboardData?.slowMovingMedicines || [];
    
    const cols = [
      { header: 'Medicine', accessor: 'medicineName' },
      { header: 'Class', accessor: 'drugClass' },
      { header: 'Units Dispensed', accessor: 'totalUnitsDispensed' },
      { header: 'Transactions', accessor: 'numberOfTransactions' },
      { header: 'Sales Value', render: (row) => `₹${row.totalSalesValue?.toLocaleString() || 0}` },
      { header: 'Current Stock', accessor: 'currentStockLevel' },
      { header: 'Days Remaining', render: (row) => row.daysOfStockRemaining === 999 ? '∞' : row.daysOfStockRemaining },
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-end">
          <h3 className="text-md font-bold text-slate-700">Fast Moving Medicines (Top 5)</h3>
          <button 
            onClick={() => exportToCSV({
              id: 'fast_moving',
              headers: ['Medicine', 'Class', 'Units Dispensed', 'Transactions', 'Current Stock'],
              columns: ['medicineName', 'drugClass', 'totalUnitsDispensed', 'numberOfTransactions', 'currentStockLevel']
            }, fast)}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-md"
          >
            <Download className="w-4 h-4 mr-1"/> Export
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-2">
          <DataTable columns={cols} data={fast} hover striped />
        </div>
        
        <div className="flex justify-between items-end mt-8">
          <h3 className="text-md font-bold text-slate-700">Slow/Non-Moving Medicines</h3>
          <button 
            onClick={() => exportToCSV({
              id: 'slow_moving',
              headers: ['Medicine', 'Class', 'Units Dispensed', 'Transactions', 'Current Stock'],
              columns: ['medicineName', 'drugClass', 'totalUnitsDispensed', 'numberOfTransactions', 'currentStockLevel']
            }, slow)}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-md"
          >
            <Download className="w-4 h-4 mr-1"/> Export
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-2">
          <DataTable columns={cols} data={slow} hover striped />
        </div>
      </div>
    );
  };

  const renderABC = () => {
    if (loadingAbc) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    
    const cols = [
      { header: 'Medicine', accessor: 'medicineName' },
      { header: 'Category', render: (row) => <Badge variant={row.category === 'A' ? 'primary' : row.category === 'B' ? 'info' : 'secondary'}>Group {row.category}</Badge> },
      { header: 'Revenue', render: (row) => `₹${row.revenueContribution?.toLocaleString() || 0}` },
      { header: 'Units', accessor: 'unitsDispensed' },
      { header: '% of Total', render: (row) => `${row.percentageOfTotal?.toFixed(2)}%` },
      { header: 'Cumulative %', render: (row) => `${row.cumulativePercentage?.toFixed(2)}%` }
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => exportToCSV({
              id: 'abc_analysis',
              headers: ['Medicine', 'Category', 'Revenue Contribution', 'Units Dispensed'],
              columns: ['medicineName', 'category', 'revenueContribution', 'unitsDispensed']
            }, abcData || [])}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md flex items-center"
          >
            <Download className="w-4 h-4 mr-1"/> Export to CSV
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <DataTable columns={cols} data={abcData || []} hover striped />
        </div>
      </div>
    );
  };

  const renderMoM = () => {
    if (loadingMom) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!momData) return null;

    const { monthA, monthB, revenuePercentageChange } = momData;
    const isUp = revenuePercentageChange >= 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Month A */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Previous Month ({monthA.monthName})</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Revenue</p>
                <p className="text-2xl font-black text-slate-800">₹{monthA.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Units Dispensed</p>
                <p className="text-lg font-bold text-slate-700">{monthA.totalUnitsDispensed}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Transactions</p>
                <p className="text-lg font-bold text-slate-700">{monthA.totalTransactions}</p>
              </div>
            </div>
          </div>
          
          {/* Month B */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 rounded-full opacity-10 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Current Month ({monthB.monthName})</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Revenue</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-slate-800">₹{monthB.totalRevenue.toLocaleString()}</p>
                  <span className={`flex items-center text-sm font-bold px-2 py-1 rounded-md ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {isUp ? <ArrowUpRight className="w-4 h-4 mr-1"/> : <ArrowDownRight className="w-4 h-4 mr-1"/>}
                    {revenuePercentageChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Units Dispensed</p>
                <p className="text-lg font-bold text-slate-700">{monthB.totalUnitsDispensed}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Transactions</p>
                <p className="text-lg font-bold text-slate-700">{monthB.totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComingSoon = (title) => (
    <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-blue-50 text-blue-500 p-4 rounded-full mb-4">
        <Info className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title} module is under development</h3>
      <p className="text-slate-500 max-w-md">The detailed breakdown for {title.toLowerCase()} is being wired up in the next sprint.</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold text-slate-800 tracking-tight">Product Sales Performance & Analytics Engine</h2>
          <p className="text-[13px] text-slate-400 font-medium tracking-wide">Track velocity, lock-in asset costs, ABC groups, ward distributions, and purchase efficiencies.</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-100 rounded-lg p-1 shadow-sm">
          {['Today', 'This Week', 'This Month', 'This Quarter'].map(period => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md ${
                dateFilter === period 
                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center border-b border-slate-200 overflow-x-auto no-scrollbar pt-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-[13px] font-bold whitespace-nowrap transition-colors relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'landing' && renderLanding()}
      {activeTab === 'velocity' && renderVelocity()}
      {activeTab === 'abc' && renderABC()}
      {activeTab === 'mom' && renderMoM()}
      {['categories', 'wards', 'reports'].includes(activeTab) && renderComingSoon(TABS.find(t => t.id === activeTab)?.label)}
    </div>
  );
}
