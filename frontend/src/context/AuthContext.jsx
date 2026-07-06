import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { ROLES } from '../config/roles.config';

const AuthContext = createContext();

const ROLE_PRIORITY = [
  ROLES.SYSTEM_ADMIN,
  ROLES.SUPERVISOR,
  ROLES.SENIOR_MEDICAL_STAFF,
  ROLES.MEDICAL_STAFF,
  ROLES.BILLING_STAFF,
  ROLES.PHARMACY_STAFF,
  ROLES.RECEPTIONIST,
  ROLES.AUDIT_COMPLIANCE,
  ROLES.LAB_TECHNICIAN,
  ROLES.STOREKEEPER
];

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    roles: [],
    activeRole: null,
    mustChangePassword: false,
    isAuthenticated: false,
    loading: true
  });

  const getHighestPriorityRole = useCallback((roles) => {
    if (!roles || roles.length === 0) return null;
    
    // Normalize roles
    const normalizedRoles = roles.map(r => {
      if (typeof r !== 'string') return '';
      let normalized = r.replace('ROLE_', '').replace(/ /g, '_').toUpperCase();
      if (normalized === 'ADMIN') return ROLES.SYSTEM_ADMIN;
      return normalized;
    });

    for (const role of ROLE_PRIORITY) {
      if (normalizedRoles.includes(role)) return role;
    }
    return normalizedRoles[0];
  }, []);

  // On mount, restore from localStorage
  useEffect(() => {
    // Listen for global auth:expired event from api.js
    const handleAuthExpired = () => {
      setAuthState({
        user: null,
        roles: [],
        activeRole: null,
        mustChangePassword: false,
        isAuthenticated: false,
        loading: false
      });
    };
    window.addEventListener('auth:expired', handleAuthExpired);

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const rolesStr = localStorage.getItem('roles');
      const activeRoleStr = localStorage.getItem('activeRole');
      const mustChangePasswordStr = localStorage.getItem('mustChangePassword');

      if (token && userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          const parsedRoles = rolesStr ? JSON.parse(rolesStr) : [];
          
          // Map restored roles to ensure they don't contain ROLE_ or legacy names
          const legacyMap = {
            'ADMIN':         'SYSTEM_ADMIN',
            'MEDICINE_USER': 'PHARMACY_STAFF',
            'BILLING_USER':  'BILLING_STAFF',
            'PURCHASE_USER': 'STOREKEEPER',
            'ADMIN_USER':    'SYSTEM_ADMIN',
          };
          const mapRole = (r) => {
            if (typeof r !== 'string') return r;
            const stripped = r.replace(/^ROLE_/, '');
            return legacyMap[stripped] || stripped;
          };

          const finalRoles = parsedRoles.length > 0 ? parsedRoles.map(mapRole) : ['SYSTEM_ADMIN'];
          let finalActiveRole = activeRoleStr ? mapRole(activeRoleStr) : (finalRoles[0] || 'SYSTEM_ADMIN');

          // Re-attach roles to user object for components that read user.roles
          const userWithRoles = { ...parsedUser, roles: finalRoles };

          setAuthState({
            user: userWithRoles,
            roles: finalRoles,
            activeRole: finalActiveRole,
            mustChangePassword: mustChangePasswordStr === 'true',
            isAuthenticated: true,
            loading: false
          });
          return; // Skip the default setLoading(false)
        } catch (e) {
          console.error("AuthContext: Restoration failed", e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('roles');
          localStorage.removeItem('activeRole');
        }
      }

      setAuthState(prev => ({ ...prev, loading: false }));
    };

    checkAuth();

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      // If the backend wraps the response in ApiResponse, the actual payload is in response.data.data
      const data = response.data.data ? response.data.data : response.data;
      

      // Store token
      localStorage.setItem('token', data.token);
      
      // ── ROLES: handle array (new RBAC) OR single string (legacy) ──
      let rolesArray = [];
      const legacyMap = {
        'ADMIN':         'SYSTEM_ADMIN',
        'MEDICINE_USER': 'PHARMACY_STAFF',
        'BILLING_USER':  'BILLING_STAFF',
        'PURCHASE_USER': 'STOREKEEPER',
        'ADMIN_USER':    'SYSTEM_ADMIN',
      };

      if (Array.isArray(data.roles) && data.roles.length > 0) {
        rolesArray = data.roles.map(r => {
          const stripped = r.replace(/^ROLE_/, '');
          return legacyMap[stripped] || stripped;
        });
      } else if (data.role && typeof data.role === 'string') {
        const stripped = data.role.replace(/^ROLE_/, '');
        const mapped = legacyMap[stripped] || stripped;
        rolesArray = [mapped];
      } else {
        rolesArray = ['SYSTEM_ADMIN'];
      }

      localStorage.setItem('roles', JSON.stringify(rolesArray));

      // Store user object
      const userData = {
        id:       data.id       || data.userId,
        name:     data.name     || data.username,
        username: data.username,
        email:    data.email    || '',
        branch:   data.branch   || 'Main Branch',
        roles:    rolesArray,   // ← ADD THIS so Sidebar role-switcher works
      };
      
      localStorage.setItem('user', JSON.stringify(userData));

      const primary = getHighestPriorityRole(rolesArray) || rolesArray[0];
      localStorage.setItem('activeRole', primary);
      localStorage.setItem('mustChangePassword', data.mustChangePassword === true ? 'true' : 'false');

      setAuthState({
        user: userData,
        roles: rolesArray,
        activeRole: primary,
        mustChangePassword: data.mustChangePassword === true,
        isAuthenticated: true,
        loading: false
      });

      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      console.error('AuthContext: Login failed', error);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    // Fire-and-forget API call to record logout timestamp on backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('mustChangePassword');
    setAuthState({
      user: null,
      roles: [],
      activeRole: null,
      mustChangePassword: false,
      isAuthenticated: false,
      loading: false
    });
  }, []);

  const switchRole = useCallback((role) => {
    setAuthState(prev => {
      if (prev.roles.includes(role)) {
        localStorage.setItem('activeRole', role);
        return { ...prev, activeRole: role };
      }
      return prev;
    });
  }, []);

  const updateMustChangePassword = useCallback((value) => {
    localStorage.setItem('mustChangePassword', value ? 'true' : 'false');
    setAuthState(prev => ({ ...prev, mustChangePassword: value }));
  }, []);

  const contextValue = React.useMemo(() => ({
    ...authState,
    login,
    logout,
    switchRole,
    updateMustChangePassword
  }), [authState, login, logout, switchRole, updateMustChangePassword]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
