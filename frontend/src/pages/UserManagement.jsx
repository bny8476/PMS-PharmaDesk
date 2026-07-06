import React, { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Users, Search, Shield, User, Phone, CheckCircle2, XCircle, Clock, Edit2, Mail, Building2, Calendar, Power, KeyRound, ScrollText } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import api from '../utils/api'; // Kept for handleResetPassword only
import UserFormModal from '../components/ui/UserFormModal';
import RoleManagementPanel from './RoleManagementPanel';
import { getRoleColor, ROLE_LABELS } from '../config/roles.config';
import AppModal from '../components/ui/AppModal';
import { formatDistanceToNow, format } from 'date-fns';
import useDebounce from '../hooks/useDebounce';

import { usePageData } from '../hooks/usePageData';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { items: users = [], isLoading: loading } = usePageData(
    'users',
    '/auth/users'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('profile');
  const [createdUser, setCreatedUser] = useState(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false); // true = reset, false = create

  const createUserMutation = useMutation({
    mutationFn: (formData) => api.post('/auth/users', formData),
    onSuccess: (res, formData) => {
      toast.success('User created successfully');
      queryClient.invalidateQueries(['users']);
      setCreatedUser({ ...res.data.data, password: formData.password });
      setIsResetMode(false);
      setIsCredentialModalOpen(true);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user')
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, formData }) => api.put(`/auth/users/${id}`, formData),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries(['users']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user')
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (user) => api.put(`/auth/users/${user.id}/status`),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries(['users']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const handleSave = (formData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (user, e) => {
    e.stopPropagation();
    toggleUserStatusMutation.mutate(user);
  };

  const handleResetPassword = async (user, e) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/auth/users/${user.id}/reset-password`);
      const result = response.data.data || response.data;
      setCreatedUser({
        name: result.name || user.name,
        username: result.username || user.username,
        password: result.temporaryPassword,
        employeeId: user.employeeId
      });
      setIsResetMode(true);
      setIsCredentialModalOpen(true);
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user, e) => {
    e.stopPropagation();
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const openDrawer = (user, tab = 'profile') => {
    setSelectedUser(user);
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  const openAuditLog = (user, e) => {
    e.stopPropagation();
    openDrawer(user, 'activity');
  };

  const displayedUsers = useMemo(() => {
    if (!debouncedSearch) return users;
    const s = debouncedSearch.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(s) ||
      u.username?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s)
    );
  }, [users, debouncedSearch]);

  const formatTimestamp = (ts) => {
    if (!ts) return null;
    try {
      let date;
      // Jackson may return [year, month, day, hour, min, sec] array format
      if (Array.isArray(ts)) {
        // Array: [yyyy, MM, dd, HH, mm, ss, nano]
        const [year, month, day, hour = 0, min = 0, sec = 0] = ts;
        date = new Date(year, month - 1, day, hour, min, sec);
      } else {
        date = new Date(ts);
      }
      if (isNaN(date.getTime())) return null;
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        full: format(date, 'dd MMM yyyy, hh:mm a')
      };
    } catch {
      return null;
    }
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { 
        header: 'User Details', 
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                  {row.profilePhotoUrl ? (
                    <img src={row.profilePhotoUrl} alt={row.name} className="w-full h-full object-cover" />
                  ) : (
                    row.name?.substring(0, 2).toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-800 truncate">{row.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{row.username}</span>
                </div>
            </div>
        )
    },
    { 
        header: 'Roles', 
        render: (row) => (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
                {row.roles?.map((role, idx) => {
                  const roleName = typeof role === 'string' ? role : role.name;
                  const colorClass = getRoleColor(roleName);
                  return (
                    <span key={roleName || idx} className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${colorClass}`}>
                      {ROLE_LABELS[roleName] || roleName}
                    </span>
                  );
                })}
            </div>
        )
    },
    { header: 'Shift', render: (row) => <span className="text-xs font-medium text-slate-700 capitalize">{row.shift?.toLowerCase() || 'Morning'}</span> },
    { header: 'Branch', render: (row) => <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{row.branch?.replace('_', ' ') || 'Main Hospital'}</span> },
    { 
        header: 'Contact', 
        render: (row) => (
            <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-700">{row.phone || 'N/A'}</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{row.email || 'N/A'}</span>
            </div>
        )
    },
    { 
        header: 'Last Login', 
        render: (row) => {
          const ts = formatTimestamp(row.lastLogin);
          return ts ? (
            <div className="flex flex-col">
              <span className="text-xs text-green-600 font-semibold">{ts.relative}</span>
              <span className="text-[10px] text-slate-400">{ts.full}</span>
            </div>
          ) : <span className="text-xs text-slate-400">Never</span>;
        }
    },
    { 
        header: 'Last Logout', 
        render: (row) => {
          const ts = formatTimestamp(row.lastLogout);
          return ts ? (
            <div className="flex flex-col">
              <span className="text-xs text-slate-600 font-semibold">{ts.relative}</span>
              <span className="text-[10px] text-slate-400">{ts.full}</span>
            </div>
          ) : <span className="text-xs text-slate-400">—</span>;
        }
    },
    { 
        header: 'Status', 
        render: (row) => {
            const status = row.status || 'ACTIVE';
            return (
              <div className={`flex items-center gap-1 ${status === 'ACTIVE' ? 'text-green-600' : status === 'SUSPENDED' ? 'text-red-600' : 'text-slate-400'}`}>
                  {status === 'ACTIVE' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="text-xs font-bold capitalize">{status.toLowerCase()}</span>
              </div>
            );
        }
    },
    {
        header: 'Actions',
        render: (row) => (
            <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => openEditModal(row, e)}
                  className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Edit User"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleToggleStatus(row, e)}
                  className={`p-1.5 rounded-lg transition-colors ${row.status === 'ACTIVE' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
                  title={row.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleResetPassword(row, e)}
                  className="p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  title="Reset Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => openAuditLog(row, e)}
                  className="p-1.5 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  title="View Audit Log"
                >
                  <ScrollText className="w-4 h-4" />
                </button>
            </div>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          User Management
        </h2>
        <p className="text-sm text-gray-500 font-medium">Manage staff accounts, credentials, and access roles</p>
      </div>

      <div className="flex border-b border-gray-200 gap-6">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Staff Directory
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Manage Roles
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <ModuleFilterBar 
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            searchPlaceholder="Search by Name, Username, Email..."
            actions={[
              { label: 'Add New User', icon: Plus, variant: 'primary', onClick: openAddModal }
            ]}
          />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <DataTable columns={columns} data={displayedUsers} loading={loading} onRowClick={(u) => openDrawer(u, 'profile')} hover striped />
          </div>
        </>
      ) : (
        <RoleManagementPanel />
      )}

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editingUser={editingUser}
      />

      {/* Sliding Drawer for User Profile */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedUser && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary font-bold text-2xl">
                  {selectedUser.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">@{selectedUser.username}</p>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex border-b border-gray-200 shrink-0">
              <button 
                onClick={() => setDrawerTab('profile')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${drawerTab === 'profile' ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50'}`}
              >
                User Profile
              </button>
              <button 
                onClick={() => setDrawerTab('activity')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${drawerTab === 'activity' ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50'}`}
              >
                Activity Log
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              {drawerTab === 'profile' ? (
                <>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Roles</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.roles?.map((role, idx) => {
                        const roleName = typeof role === 'string' ? role : role.name;
                        const colorClass = getRoleColor(roleName);
                        return (
                          <span key={roleName || idx} className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${colorClass}`}>
                            {ROLE_LABELS[roleName] || roleName}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Login Activity</h4>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Last Login</p>
                      {formatTimestamp(selectedUser.lastLogin) ? (
                        <>
                          <p className="text-sm font-bold text-slate-800">{formatTimestamp(selectedUser.lastLogin).relative}</p>
                          <p className="text-xs text-slate-500">{formatTimestamp(selectedUser.lastLogin).full}</p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-slate-400">Never logged in</p>
                      )}
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Logout</p>
                      {formatTimestamp(selectedUser.lastLogout) ? (
                        <>
                          <p className="text-sm font-bold text-slate-800">{formatTimestamp(selectedUser.lastLogout).relative}</p>
                          <p className="text-xs text-slate-500">{formatTimestamp(selectedUser.lastLogout).full}</p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-slate-400">—</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Details</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" /> {selectedUser.phone || 'N/A'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Mail className="w-4 h-4 text-slate-400" /> {selectedUser.email || 'N/A'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Building2 className="w-4 h-4 text-slate-400" /> {selectedUser.branch?.replace('_', ' ') || 'Main Hospital'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">System Info</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400" /> Shift: <span className="capitalize">{selectedUser.shift?.toLowerCase() || 'Morning'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <ScrollText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Activity Log</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Recent actions performed by this user will appear here.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={(e) => {
                  setIsDrawerOpen(false);
                  openEditModal(selectedUser, e);
                }}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
              <button 
                onClick={(e) => {
                  handleResetPassword(selectedUser, e);
                  setIsDrawerOpen(false);
                }}
                className="flex-1 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl shadow-sm hover:bg-amber-100 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Reset Password
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Credential Card Modal */}
      <AppModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        title={isResetMode ? "Password Reset Successfully" : "Staff Credentials Created"}
        maxWidth="sm:max-w-md"
      >
        <div className="p-4 space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-20 h-20" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isResetMode ? 'Staff Name' : 'Employee ID'}
                  </p>
                  <h3 className="text-xl font-black tracking-tighter text-blue-400">
                    {isResetMode ? createdUser?.name : createdUser?.employeeId}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                   <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="h-px bg-white/10"></div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</p>
                    <p className="font-bold text-sm">{createdUser?.username}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {isResetMode ? 'Temporary Password' : 'Initial Password'}
                    </p>
                    <p className="font-bold text-sm text-amber-400">{createdUser?.password}</p>
                 </div>
              </div>

              <div className="pt-2">
                 <p className="text-[9px] text-slate-500 italic">
                   {isResetMode 
                     ? 'Share this temporary password securely. The user should change it on their next login.'
                     : 'Please share these credentials with the employee. They should change their password upon first login.'}
                 </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCredentialModalOpen(false)}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all"
          >
            Done, I've Noted it
          </button>
        </div>
      </AppModal>
    </div>
  );
}
