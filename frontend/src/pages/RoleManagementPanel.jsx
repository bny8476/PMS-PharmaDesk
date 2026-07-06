import React, { useState, useEffect } from 'react';
import { Shield, Edit2, Users, Plus, Check, X, Loader2, Trash2 } from 'lucide-react';
import { MODULE_PERMISSIONS } from '../config/roles.config';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import AppModal from '../components/ui/AppModal';

export default function RoleManagementPanel({ onBack }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6', permissions: [] });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/roles');
      setRoles(res.data?.data || res.data || []);
    } catch (err) {
      toast.error('Failed to load roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', color: '#3B82F6', permissions: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    let parsedPerms = [];
    try {
      parsedPerms = role.permissionsJson ? JSON.parse(role.permissionsJson) : [];
    } catch(e) {}
    setFormData({ name: role.name, color: role.color || '#3B82F6', permissions: parsedPerms });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId) => {
    if (editingRole && editingRole.isSystemDefault) return; // Prevent editing system defaults
    setFormData(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim().toUpperCase().replace(/\s+/g, '_'),
        color: formData.color,
        permissionsJson: JSON.stringify(formData.permissions)
      };

      if (editingRole) {
        await api.put(`/auth/roles/${editingRole.id}`, payload);
        toast.success('Role updated successfully');
      } else {
        await api.post('/auth/roles', payload);
        toast.success('Role created successfully');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionsList = (role) => {
    let active = [];
    try {
      active = role.permissionsJson ? JSON.parse(role.permissionsJson) : [];
    } catch(e) {}

    if (active.includes('ALL')) {
      return [{ id: 'ALL', label: 'Full System Access', active: true }];
    }
    
    const list = [];
    Object.values(MODULE_PERMISSIONS).forEach(category => {
      category.forEach(perm => {
        if (active.includes(perm.id)) {
          list.push({ ...perm, active: true });
        }
      });
    });
    
    if (list.length < 4) {
      const allPerms = Object.values(MODULE_PERMISSIONS).flat();
      for (const p of allPerms) {
        if (!list.find(x => x.id === p.id) && list.length < 4) {
          list.push({ ...p, active: false });
        }
      }
    }
    return list;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">System Roles & Permissions</h2>
        <div className="flex gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Back
            </button>
          )}
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(Array.isArray(roles) ? roles : []).map((role) => {
          const perms = getPermissionsList(role);
          const activeCount = perms.filter(p => p.active).length;
          const isSystemAdmin = role.name === 'SYSTEM_ADMIN';

          return (
            <div key={role.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: role.color ? `${role.color}20` : '#EFF6FF', color: role.color || '#2563EB' }}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{role.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                      <Users className="w-3.5 h-3.5" /> Users Assigned
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEdit(role)}
                  className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                  title="Edit Role"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Active Permissions ({activeCount})
                </p>
                
                <div className="space-y-4">
                  {perms.map((perm, idx) => (
                    <div key={idx} className={`flex items-center justify-between ${isSystemAdmin ? 'bg-indigo-50 p-3 rounded-lg border border-indigo-100' : ''}`}>
                      <span className={`text-sm font-bold ${isSystemAdmin ? 'text-indigo-700' : 'text-slate-700 uppercase'}`}>
                        {perm.label}
                      </span>
                      
                      <div className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full ${perm.active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${perm.active ? 'translate-x-2' : '-translate-x-2'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}
        maxWidth="sm:max-w-2xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.name}
              className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Role
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {editingRole?.isSystemDefault && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200 flex items-start gap-3">
              <Shield className="w-5 h-5 shrink-0 mt-0.5" />
              <p><strong>System Default Role:</strong> You cannot modify the permissions or name of this core system role. You can only customize its display color.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Role Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={editingRole?.isSystemDefault}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g. SENIOR_PHARMACIST"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Display Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                />
                <span className="text-sm text-slate-500 uppercase font-mono">{formData.color}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Permissions</h4>
            <div className="space-y-6">
              {Object.entries(MODULE_PERMISSIONS).map(([moduleName, perms]) => (
                <div key={moduleName}>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{moduleName}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {perms.map(perm => {
                      const isSelected = formData.permissions.includes(perm.id) || formData.permissions.includes('ALL');
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          disabled={editingRole?.isSystemDefault}
                          onClick={() => handleTogglePermission(perm.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                              : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-600'
                          } ${editingRole?.isSystemDefault ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{perm.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
