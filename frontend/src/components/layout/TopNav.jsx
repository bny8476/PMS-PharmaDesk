import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, X, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles.config';
import api from '../../utils/api';
import { useQuery } from '@tanstack/react-query';

export default function TopNav({ onMenuClick }) {
  const { user, activeRole } = useAuth();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ['top-nav-alerts'],
    queryFn: () => api.get('/pharmacy/dashboard/alerts').then(r => r.data?.data ?? []),
    staleTime: 30000,
    refetchInterval: 60000,
    enabled: !!activeRole
  });

  const getInitials = (name) => {
    if (!name) return 'HG';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const SEVERITY_STYLES = {
    INFO:     { badge: 'bg-blue-100 text-blue-700',   icon: Activity,       iconColor: 'text-blue-500',   bg: 'bg-blue-50' },
    WARNING:  { badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle,  iconColor: 'text-amber-500',  bg: 'bg-amber-50' },
    CRITICAL: { badge: 'bg-red-100 text-red-700',     icon: ShieldAlert,    iconColor: 'text-red-500',    bg: 'bg-red-50' },
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

  return (
    <>
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden md:block">
            {/* Global Search (Pending implementation)
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search patient UHID, medicine, bills..." 
              className="pl-10 pr-4 py-2 w-full max-w-[500px] md:w-[400px] lg:w-[500px] bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            */}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsAlertsOpen(true)}
            className="relative p-2 text-gray-500 hover:text-primary transition-colors"
          >
            <Bell className="w-5 h-5" />
            {alerts && alerts.length > 0 && (
              <span className="absolute top-0 right-0 min-w-4 min-h-4 px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white translate-x-1/4 -translate-y-1/4">
                {alerts.length > 99 ? '99+' : alerts.length}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">Hospital General</p>
              <p className="text-xs text-gray-500">{user?.branch || 'Main Branch'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {getInitials(user?.name)}
            </div>
          </div>
        </div>
      </header>

      {/* Alerts Drawer */}
      {isAlertsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">System Alerts</h2>
                <p className="text-sm text-gray-500">{alerts?.length || 0} active alerts</p>
              </div>
              <button 
                onClick={() => setIsAlertsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {alerts && alerts.length > 0 ? (
                alerts.map(alert => {
                  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.INFO;
                  const Icon = style.icon;
                  return (
                    <div key={alert.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                        <Icon className={`w-4 h-4 ${style.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-800 truncate">{alert.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{getRelativeTime(alert.createdAt)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                              {alert.severity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{alert.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-sm text-gray-500 py-10">No active alerts at this time.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
