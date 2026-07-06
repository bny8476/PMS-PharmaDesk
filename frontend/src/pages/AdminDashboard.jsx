import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
         XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Package, IndianRupee, FileText, AlertTriangle, Calendar, Users,
  Plus, ScanLine, PackagePlus, ShoppingCart, ClipboardList, Printer,
  Clock, TrendingUp, TrendingDown, Activity, Thermometer, ShieldAlert,
  Truck, RotateCcw, CheckSquare, Receipt
} from 'lucide-react';
import KPICard from '../components/ui/KPICard';

const ROLE_CONFIG = {
  SYSTEM_ADMIN: {
    greeting: 'System Admin',
    subtitle: 'Operational dashboard and real-time pharmacy metrics overview.',
    kpiKeys: ['totalSkus', 'todayRevenue', 'lowStockAlerts', 'expiringIn30Days', 'activePatientsToday'],
    chartType: 'bar',
    chartLabel: '7-Day Sales Revenue',
    quickActions: [
      { label: 'New Sale', icon: Plus, path: '/sales' },
      { label: 'Scan Barcode', icon: ScanLine, path: '/barcode-scanner' },
      { label: 'Add Stock', icon: PackagePlus, path: '/stocks' },
      { label: 'Create PO', icon: ShoppingCart, path: '/purchase-orders' },
      { label: 'Print Day Report', icon: Printer, action: 'printDayReport' },
    ],
  },
  PHARMACY_STAFF: {
    greeting: 'Pharmacy Staff',
    subtitle: 'Your dispensing queue and daily sales overview.',
    kpiKeys: ['billsRaisedToday', 'todayCollections', 'pendingDispensals',
               'lowStockItems', 'myReturnsToday', 'creditBillsPending'],
    chartType: 'line',
    chartLabel: "Today's Hourly Sales",
    quickActions: [
      { label: 'New Sale', icon: Plus, path: '/sales' },
      { label: 'Scan Barcode', icon: ScanLine, path: '/barcode-scanner' },
      { label: 'Process Return', icon: RotateCcw, path: '/returns' },
      { label: 'Print Receipt', icon: Printer, action: 'printReceipt' },
    ],
  },
  BILLING_STAFF: {
    greeting: 'Billing Staff',
    subtitle: 'Billing queue, collections, and clearance overview.',
    kpiKeys: ['billsRaisedToday', 'totalCollected', 'pendingClearances',
               'advanceRequests', 'creditBills', 'consolidatedBillsPending'],
    chartType: 'bar',
    chartLabel: 'Payment Mode Breakdown',
    quickActions: [
      { label: 'New Bill', icon: Plus, path: '/sales' },
      { label: 'View Advances', icon: IndianRupee, path: '/advances' },
      { label: 'Process Clearance', icon: CheckSquare, path: '/clearance' },
      { label: 'Print Bill', icon: Printer, action: 'printBill' },
      { label: 'View Consolidated', icon: FileText, path: '/consolidated-bills' },
      { label: 'Day Close', icon: Calendar, action: 'dayClose' },
    ],
  },
  STOREKEEPER: {
    greeting: 'Storekeeper',
    subtitle: 'Purchase orders, GRN, and stock movement overview.',
    kpiKeys: ['posPendingApproval', 'grnsAwaitingVerification', 'lowStockSkus',
               'expiringIn30Days', 'supplierReturnsPending', 'stockValue'],
    chartType: 'dualBar',
    chartLabel: 'Stock Inflow vs Outflow (7 Days)',
    quickActions: [
      { label: 'Create PO', icon: ShoppingCart, path: '/purchase-orders' },
      { label: 'Record GRN', icon: Truck, path: '/grn' },
      { label: 'Adjust Stock', icon: PackagePlus, path: '/stocks' },
      { label: 'Supplier Return', icon: RotateCcw, path: '/returns' },
      { label: 'View Low Stock', icon: AlertTriangle, path: '/low-stock-alerts' },
      { label: 'View Expiry', icon: Calendar, path: '/expiry-tracker' },
    ],
  },
  SUPERVISOR: {
    greeting: 'Supervisor',
    subtitle: 'Team activity, approvals, and operational metrics.',
    kpiKeys: ['totalSalesToday', 'staffActive', 'pendingApprovals',
               'returnsAwaitingApproval', 'lowStockAlerts', 'systemHealthPct'],
    chartType: 'bar',
    chartLabel: 'Department Sales Breakdown',
    quickActions: [
      { label: 'Approve Returns', icon: CheckSquare, path: '/returns' },
      { label: 'View Staff Activity', icon: Users, path: '/users' },
      { label: 'Run Report', icon: FileText, path: '/reports' },
      { label: 'View Alerts', icon: AlertTriangle, action: 'scrollToAlerts' },
      { label: 'Manage Users', icon: Users, path: '/users' },
      { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    ],
  },
  RECEPTIONIST: {
    greeting: 'Receptionist',
    subtitle: 'Patient registration and appointments overview.',
    kpiKeys: ['activePatientsToday'],
    chartType: 'line',
    chartLabel: 'Patient Flow',
    quickActions: [
      { label: 'Patients', icon: Users, path: '/patients' }
    ]
  },
  MEDICAL_STAFF: {
    greeting: 'Medical Staff',
    subtitle: 'Prescriptions and dispensals overview.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Prescriptions Volume',
    quickActions: [
    ]
  },
  SENIOR_MEDICAL_STAFF: {
    greeting: 'Senior Medical Staff',
    subtitle: 'Prescriptions and dispensals overview.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Prescriptions Volume',
    quickActions: []
  },
  AUDIT_COMPLIANCE: {
    greeting: 'Audit & Compliance',
    subtitle: 'Read-only access to reports, logs, and audit trails.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Activity Overview',
    quickActions: [
      { label: 'View Reports', icon: FileText, path: '/reports' },
    ]
  },
  LAB_TECHNICIAN: {
    greeting: 'Lab Technician',
    subtitle: 'Lab requests and results overview.',
    kpiKeys: [],
    chartType: 'bar',
    chartLabel: 'Lab Activity',
    quickActions: []
  }
};

const KPI_META = {
  totalSkus:                 { label: 'Total SKUs in Stock',       icon: Package,       color: 'blue' },
  todayRevenue:              { label: "Today's Sales Revenue",     icon: IndianRupee,   color: 'green',  prefix: '₹' },
  pendingPrescriptions:      { label: 'Pending Prescriptions',     icon: FileText,      color: 'amber' },
  lowStockAlerts:            { label: 'Low Stock Alerts',          icon: AlertTriangle, color: 'orange' },
  expiringIn30Days:          { label: 'Expiring in 30 Days',       icon: Calendar,      color: 'red' },
  activePatientsToday:       { label: 'Active Patients Today',     icon: Users,         color: 'purple' },
  billsRaisedToday:          { label: 'Bills Raised Today',        icon: Receipt,       color: 'blue' },
  todayCollections:          { label: "Today's Collections",       icon: IndianRupee,   color: 'green',  prefix: '₹' },
  pendingDispensals:         { label: 'Pending Dispensals',        icon: ClipboardList, color: 'amber' },
  lowStockItems:             { label: 'Low Stock Items',           icon: AlertTriangle, color: 'orange' },
  myReturnsToday:            { label: 'My Returns Today',          icon: RotateCcw,     color: 'slate' },
  creditBillsPending:        { label: 'Credit Bills Pending',      icon: FileText,      color: 'red' },
  totalCollected:            { label: 'Total Collected',           icon: IndianRupee,   color: 'green',  prefix: '₹' },
  pendingClearances:         { label: 'Pending Clearances',        icon: CheckSquare,   color: 'amber' },
  advanceRequests:           { label: 'Advance Requests',          icon: IndianRupee,   color: 'blue' },
  creditBills:               { label: 'Credit Bills',              icon: Receipt,       color: 'red' },
  consolidatedBillsPending:  { label: 'Consolidated Bills Pending',icon: FileText,      color: 'slate' },
  posPendingApproval:        { label: 'POs Pending Approval',      icon: ShoppingCart,  color: 'amber' },
  grnsAwaitingVerification:  { label: 'GRNs Awaiting Verification',icon: Truck,         color: 'blue' },
  lowStockSkus:              { label: 'Low Stock SKUs',            icon: AlertTriangle, color: 'orange' },
  supplierReturnsPending:    { label: 'Supplier Returns Pending',  icon: RotateCcw,     color: 'slate' },
  stockValue:                { label: 'Stock Value',               icon: IndianRupee,   color: 'green',  prefix: '₹' },
  totalSalesToday:           { label: 'Total Sales Today',         icon: IndianRupee,   color: 'green',  prefix: '₹' },
  staffActive:               { label: 'Staff Active',              icon: Users,         color: 'blue' },
  pendingApprovals:          { label: 'Pending Approvals',         icon: CheckSquare,   color: 'amber' },
  returnsAwaitingApproval:   { label: 'Returns Awaiting Approval', icon: RotateCcw,     color: 'red' },
  systemHealthPct:           { label: 'System Health',             icon: Activity,      color: 'green',  suffix: '%' },
};

function AdminKpiWrapper({ kpiKey, value, delta, deltaType }) {
  const meta = KPI_META[kpiKey] || { label: kpiKey, icon: Activity, color: 'slate' };
  const isLoading = value === undefined || value === null;

  const displayValue = isLoading ? '—' : 
    meta.prefix ? `${meta.prefix}${Number(value).toLocaleString('en-IN')}` :
    meta.suffix ? `${Number(value).toLocaleString('en-IN')}${meta.suffix}` :
    Number(value).toLocaleString('en-IN');

  const subtext = delta !== undefined ? `${deltaType === 'up' ? '↑' : '↓'} ${delta} vs yesterday` : undefined;

  return (
    <KPICard
      title={meta.label}
      value={displayValue}
      icon={meta.icon}
      subtext={subtext}
      trend={deltaType === 'up' ? 'up' : deltaType === 'down' ? 'down' : 'neutral'}
    />
  );
}

const SEVERITY_STYLES = {
  INFO:     { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',   icon: Activity },
  WARNING:  { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500',  icon: AlertTriangle },
  CRITICAL: { badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500',    icon: ShieldAlert },
};

const getRelativeTime = (isoStr) => {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

function AlertRow({ alert }) {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.INFO;
  const Icon = style.icon;
  const relTime = getRelativeTime(alert.createdAt);
  
  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${alert.severity === 'CRITICAL' ? 'bg-red-50' : 
          alert.severity === 'WARNING' ? 'bg-amber-50' : 'bg-blue-50'}`}>
        <Icon className={`w-4 h-4 
          ${alert.severity === 'CRITICAL' ? 'text-red-500' :
            alert.severity === 'WARNING' ? 'text-amber-500' : 'text-blue-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-gray-800 truncate">{alert.title}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">{relTime}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
              {alert.severity}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{alert.description}</p>
      </div>
    </div>
  );
}

function DashboardChart({ chartType, data, label }) {
  const CHART_COLOR = '#3B82F6';
  const CHART_COLOR_2 = '#10B981';
  
  const CustomTooltip = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{lbl}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.name?.includes('Revenue') || p.name?.includes('₹') 
              ? `₹${Number(p.value).toLocaleString('en-IN')}` 
              : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      {chartType === 'bar' ? (
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                 tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Sales Revenue" fill={CHART_COLOR} radius={[6,6,0,0]}
               activeBar={{ fill: '#1D4ED8' }} />
        </BarChart>
      ) : chartType === 'line' ? (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                 tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Line dataKey="value" name="Sales (₹)" stroke={CHART_COLOR} strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLOR }} activeDot={{ r: 5 }} />
        </LineChart>
      ) : chartType === 'dualBar' ? (
        <BarChart data={data} barSize={20} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value"     name="Inflow"  fill={CHART_COLOR}   radius={[4,4,0,0]} />
          <Bar dataKey="secondary" name="Outflow" fill={CHART_COLOR_2} radius={[4,4,0,0]} />
        </BarChart>
      ) : null}
    </ResponsiveContainer>
  );
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getFormattedDate = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });


export default function AdminDashboard() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const config = ROLE_CONFIG[activeRole] || ROLE_CONFIG.SYSTEM_ADMIN;

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpis', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard').then(r => r.data?.data ?? {}),
    staleTime: 2000,
    refetchInterval: 5000,
    enabled: !!activeRole
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard/chart-data?days=7').then(r => r.data?.data ?? []),
    staleTime: 5000,
    refetchInterval: 15000,
    enabled: !!activeRole
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard/alerts').then(r => r.data?.data ?? []),
    staleTime: 2000,
    refetchInterval: 5000,
    enabled: !!activeRole
  });

  const { data: revenueStrip, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue', activeRole],
    queryFn: () => api.get('/pharmacy/dashboard/revenue-strip').then(r => r.data?.data ?? {}),
    staleTime: 5000,
    refetchInterval: 10000,
    enabled: !!activeRole
  });

  const handleAction = (actionName) => {
    // Future: dispatch action-specific logic (e.g. print day report)
    void actionName;
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()},{' '}
            <span className="text-blue-600">{config.greeting}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 
                          rounded-lg px-3 py-2 shadow-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">{getFormattedDate()}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 
                          shadow-sm font-semibold text-gray-700">
            {user?.branch || 'Main Branch'}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {config.kpiKeys.map(key => (
          <AdminKpiWrapper
            key={key}
            kpiKey={key}
            value={kpiData?.[key]}
            delta={kpiData?.deltas?.[key]}
            deltaType={kpiData?.deltaTypes?.[key]}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {config.quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => action.path ? navigate(action.path) : handleAction(action.action)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200
                           bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700
                           text-sm font-semibold text-gray-700 transition-all duration-150 shadow-sm"
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chart (3/5 width) */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">{config.chartLabel}</h3>
            <button className="text-xs text-blue-500 font-semibold hover:underline">
              Operational breakdown
            </button>
          </div>
          {chartData?.length ? (
            <DashboardChart chartType={config.chartType} data={chartData} label={config.chartLabel} />
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent 
                              rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Alerts panel (2/5 width) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Active System Alerts</h3>
            <span className="text-xs text-gray-400 font-medium">
              {alerts?.length ?? 0} sources monitored
            </span>
          </div>
          <div className="space-y-0 overflow-y-auto max-h-[260px] pr-1">
            {alerts?.length ? (
              alerts.slice(0, 6).map(alert => <AlertRow key={alert.id} alert={alert} />)
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No active alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "TODAY'S REVENUE",      key: 'todayRevenue' },
          { label: "THIS WEEK'S REVENUE",  key: 'weekRevenue' },
          { label: "THIS MONTH'S REVENUE", key: 'monthRevenue' },
        ].map(({ label, key }) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {revenueStrip?.[key] != null
                ? `₹${Number(revenueStrip[key]).toLocaleString('en-IN')}`
                : <span className="inline-block h-8 w-28 bg-gray-100 rounded animate-pulse" />}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
