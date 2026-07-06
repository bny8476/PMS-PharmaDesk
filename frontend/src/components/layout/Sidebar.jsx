import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { ROLES, ROLE_LABELS, DASHBOARD_ROUTES, getBaseRoleForUI } from '../../config/roles.config';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Building2, ShoppingCart, RotateCcw, LayoutDashboard, CreditCard,
  Settings, ArrowLeftRight, ClipboardList, Store, Undo2, Syringe,
  Banknote, Receipt, FileCheck, Stethoscope, RefreshCw, Box,
  BarChart3, ListTodo, Pill, LogOut, ChevronDown, Truck, Users,
  FileText, AlertTriangle, CalendarX, ShieldAlert, Thermometer,
  ShieldCheck, ScanBarcode, Shield, PlusCircle, Calendar,
  TrendingUp, ClipboardCheck, FilePlus, ShoppingBag, BarChart2, UserCog, Zap, Package,
  UserCircle, KeyRound, Menu, UserRound
} from 'lucide-react';

const NAV_BY_ROLE = {
  SYSTEM_ADMIN: [
    { name: 'System Admin Dashboard', path: '/dashboard/admin',      icon: LayoutDashboard },
    { name: 'Medicine Master',         path: '/medicines',            icon: Pill },
    { name: 'Stock Management',        path: '/stocks',               icon: Package },
    { name: 'Pharmacy Sales',          path: '/sales',                icon: ShoppingCart },
    { name: 'Medicine Returns',        path: '/returns',              icon: RotateCcw },
    { name: 'Return Worklists',        path: '/return-worklists',     icon: ClipboardList },
    { name: 'Pending Indent Pres.',    path: '/pending-indents',      icon: FilePlus },
    { name: 'Pending Pharmacy Rep.',   path: '/pending-replacement',  icon: RefreshCw },
    { name: 'Consolidated Bills',      path: '/consolidated-bills',   icon: Receipt },
    { name: 'Purchase Orders',         path: '/purchase-orders',      icon: ShoppingBag },
    { name: 'GRN Entry',               path: '/grn',                  icon: Truck },
    { name: 'Suppliers',               path: '/suppliers',            icon: Building2 },
    { name: 'Doctors',                 path: '/doctors',              icon: UserRound },
    { name: 'Patients',                path: '/patients',             icon: Users },
    { name: 'Low Stock Alerts',        path: '/low-stock-alerts',     icon: AlertTriangle },
    { name: 'Expiry Tracker',          path: '/expiry-tracker',       icon: Calendar },
    { name: 'Drug Interactions',       path: '/drug-interactions',    icon: Zap },
    { name: 'Temperature Logs',        path: '/temperature-logs',     icon: Thermometer },
    { name: 'Narcotics Register',      path: '/narcotics',            icon: Shield },
    { name: 'Barcode Scanner',         path: '/barcode-scanner',      icon: ScanBarcode },
    { name: 'Insurance Claims',        path: '/insurance-claims',     icon: FileCheck },
    { name: 'Analytics',               path: '/analytics',            icon: TrendingUp },
    { name: 'Reports',                 path: '/reports',              icon: BarChart2 },
    { name: 'User Management',         path: '/users',                icon: UserCog },
    { name: 'Role Management',         path: '/roles',                icon: ShieldCheck },
    { name: 'Pharmacy Advances',       path: '/advances',             icon: Banknote },
    { name: 'Pharmacy Clearance',      path: '/clearance',            icon: FileCheck },
    { name: 'Product Performance',     path: '/performance',          icon: TrendingUp },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  PHARMACY_STAFF: [
    { name: 'Pharmacy Dashboard',      path: '/dashboard/pharmacy',   icon: LayoutDashboard },
    { name: 'Pharmacy Sales',          path: '/sales',                icon: ShoppingCart },
    { name: 'Medicine Returns',        path: '/returns',              icon: RotateCcw },
    { name: 'Medicine Master',         path: '/medicines',            icon: Pill },
    { name: 'Barcode Scanner',         path: '/barcode-scanner',      icon: ScanBarcode },
    { name: 'Low Stock Alerts',        path: '/low-stock-alerts',     icon: AlertTriangle },
    { name: 'Expiry Tracker',          path: '/expiry-tracker',       icon: Calendar },
    { name: 'Drug Interactions',       path: '/drug-interactions',    icon: Zap },
    { name: 'Temperature Logs',        path: '/temperature-logs',     icon: Thermometer },
    { name: 'Narcotics Register',      path: '/narcotics',            icon: Shield },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  BILLING_STAFF: [
    { name: 'Billing Dashboard',       path: '/dashboard/billing',    icon: LayoutDashboard },
    { name: 'Pharmacy Sales',          path: '/sales',                icon: ShoppingCart },
    { name: 'Medicine Returns',        path: '/returns',              icon: RotateCcw },
    { name: 'Consolidated Bills',      path: '/consolidated-bills',   icon: Receipt },
    { name: 'Patients',                path: '/patients',             icon: Users },
    { name: 'Insurance Claims',        path: '/insurance-claims',     icon: FileCheck },
    { name: 'Pharmacy Advances',       path: '/advances',             icon: Banknote },
    { name: 'Pharmacy Clearance',      path: '/clearance',            icon: FileCheck },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  STOREKEEPER: [
    { name: 'Store Dashboard',         path: '/dashboard/store',      icon: LayoutDashboard },
    { name: 'Stock Management',        path: '/stocks',               icon: Package },
    { name: 'Purchase Orders',         path: '/purchase-orders',      icon: ShoppingBag },
    { name: 'GRN Entry',               path: '/grn',                  icon: Truck },
    { name: 'Suppliers',               path: '/suppliers',            icon: Building2 },
    { name: 'Doctors',                 path: '/doctors',              icon: UserRound },
    { name: 'Low Stock Alerts',        path: '/low-stock-alerts',     icon: AlertTriangle },
    { name: 'Expiry Tracker',          path: '/expiry-tracker',       icon: Calendar },
    { name: 'Temperature Logs',        path: '/temperature-logs',     icon: Thermometer },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  SUPERVISOR: [
    { name: 'Supervisor Dashboard',    path: '/dashboard/supervisor', icon: LayoutDashboard },
    { name: 'Return Worklists',        path: '/return-worklists',     icon: ClipboardList },
    { name: 'Analytics',               path: '/analytics',            icon: TrendingUp },
    { name: 'Reports',                 path: '/reports',              icon: BarChart2 },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  RECEPTIONIST: [
    { name: 'Reception Dashboard',     path: '/dashboard/reception', icon: LayoutDashboard },
    { name: 'Patients',                path: '/patients',             icon: Users },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  MEDICAL_STAFF: [
    { name: 'Medical Dashboard',       path: '/dashboard/medical',    icon: LayoutDashboard },
    { name: 'Drug Interactions',       path: '/drug-interactions',    icon: Zap },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  SENIOR_MEDICAL_STAFF: [
    { name: 'Senior Medical Dashboard',path: '/dashboard/senior-medical', icon: LayoutDashboard },
    { name: 'Drug Interactions',       path: '/drug-interactions',    icon: Zap },
    { name: 'Profile Settings',        path: '/profile',              icon: UserCircle },
    { name: 'Reset Password',          path: '/reset-password',       icon: KeyRound },
  ],
  AUDIT_COMPLIANCE: [
    { name: 'Audit Dashboard',  path: '/dashboard/audit',   icon: LayoutDashboard },
    { name: 'Reports',          path: '/reports',            icon: BarChart2 },
    { name: 'Profile Settings', path: '/profile',            icon: UserCircle },
    { name: 'Reset Password',   path: '/reset-password',     icon: KeyRound },
  ],
  LAB_TECHNICIAN: [
    { name: 'Lab Dashboard',    path: '/dashboard/lab',      icon: LayoutDashboard },
    { name: 'Medicine Master',  path: '/medicines',          icon: Pill },
    { name: 'Drug Interactions',path: '/drug-interactions',  icon: Zap },
    { name: 'Profile Settings', path: '/profile',            icon: UserCircle },
    { name: 'Reset Password',   path: '/reset-password',     icon: KeyRound },
  ]
};

import { useQueryClient } from '@tanstack/react-query';
import pharmacyService from '../../utils/pharmacyService';

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
  const { user, roles, activeRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPrefetchConfig = (path) => {
    switch (path) {
      case '/medicines': return { key: ['medicines', { page: 0, size: 20 }], url: '/pharmacy/medicines' };
      case '/stocks': return { key: ['stocks', { page: 0, size: 20 }], url: '/pharmacy/stocks' };
      case '/patients': return { key: ['patients', { page: 0, size: 20 }], url: '/pharmacy/patients' };
      case '/suppliers': return { key: ['suppliers', { page: 0, size: 20 }], url: '/pharmacy/suppliers' };
      case '/sales': return { key: ['sales', { page: 0, size: 20 }], url: '/pharmacy/sales' };
      case '/purchase-orders': return { key: ['purchase-orders', { page: 0, size: 20 }], url: '/pharmacy/purchase-orders' };
      default: return null;
    }
  };

  const handlePrefetch = (path) => {
    const config = getPrefetchConfig(path);
    if (!config) return;
    
    const state = queryClient.getQueryState(config.key);
    if (!state || state.isStale) {
      queryClient.prefetchQuery({
        queryKey: config.key,
        queryFn: () => pharmacyService.api.get(config.url, { params: { page: 0, size: 20 } }).then(res => res.data?.data?.content || res.data?.content || res.data || []),
        staleTime: 10000 // 10s to prevent spamming on rapid hover
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const currentRole = activeRole || roles?.[0] || 'SYSTEM_ADMIN';
  const baseRole = getBaseRoleForUI(currentRole);
  const navItems = NAV_BY_ROLE[baseRole] || NAV_BY_ROLE.PHARMACY_STAFF;

  const getDashboardPath = () => DASHBOARD_ROUTES[baseRole] || '/dashboard/pharmacy';

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-screen bg-[#1B2A4A] text-white flex flex-col shadow-2xl z-20 transition-all duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      isCollapsed ? "w-20" : "w-72"
    )}>
      <div className={cn("h-20 flex items-center border-b border-white/5 shrink-0", isCollapsed ? "justify-center" : "px-6 justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight tracking-tight truncate">PharmaDesk</h1>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest truncate">DRHMS INTEGRATED</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => {
            if (window.innerWidth < 1024 && setIsOpen) {
              setIsOpen(false);
            } else if (setIsCollapsed) {
              setIsCollapsed(!isCollapsed);
            }
          }}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      
      {/* Role Switcher */}
      {roles?.length > 1 && !isCollapsed && (
        <div className="px-4 py-3 border-b border-white/5 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
          >
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">Active Role</span>
              <span className="text-sm font-medium text-white truncate w-full text-left">{ROLE_LABELS[activeRole] || activeRole || 'Staff'}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-blue-300 transition-transform", isRoleDropdownOpen ? "rotate-180" : "")} />
          </button>
          
          <AnimatePresence>
            {isRoleDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-4 right-4 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden"
              >
                {roles.map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRole(role);
                      setIsRoleDropdownOpen(false);
                      navigate(DASHBOARD_ROUTES[role] || '/');
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      activeRole === role ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {ROLE_LABELS[role] || role}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
        {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Main Modules</p>}
        {navItems.map((item) => {
          const path = item.path === '/' ? getDashboardPath() : item.path;
          
          const isActive = location.pathname === path || 
                           (item.path !== '/' && location.pathname.startsWith(`${item.path}/`)) ||
                           (item.path === '/' && location.pathname.startsWith('/dashboard'));
          
          return (
            <NavLink
              key={item.path}
              to={path}
              onClick={() => {
                if (window.innerWidth < 1024 && setIsOpen) {
                  setIsOpen(false);
                }
              }}
              onMouseEnter={() => handlePrefetch(item.path)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm transition-all duration-300 group",
                isActive 
                  ? "bg-blue-600 text-white font-semibold rounded-xl shadow-lg" 
                  : "text-slate-300 hover:bg-slate-700/60 hover:text-white rounded-xl"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-transform duration-300 shrink-0",
                "group-hover:scale-110"
              )} />
              {!isCollapsed && (
                <span className="truncate">
                  {item.name}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-white/5 bg-[#1B2A4A]", isCollapsed ? "flex justify-center" : "")}>
        <div className={cn("flex items-center bg-slate-700/50 rounded-xl group", isCollapsed ? "justify-center p-2" : "gap-3 px-4 py-3")}>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 group-hover:scale-105 transition-transform cursor-pointer" title={user?.name}>
            {getInitials(user?.name)}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Unknown User'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">
                  {ROLE_LABELS[activeRole] || activeRole || 'Staff'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition-colors shrink-0"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
