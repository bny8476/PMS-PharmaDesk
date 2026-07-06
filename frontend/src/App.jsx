import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import RoleGuard from './components/auth/RoleGuard';
import { ROLES, DASHBOARD_ROUTES, getBaseRoleForUI } from './config/roles.config';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Eager load critical pages to avoid Suspense hangs during auth flow
import LoginPage from './pages/LoginPage';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PharmacyDashboard = lazy(() => import('./pages/PharmacyDashboard'));

// Lazy load other modules
const PharmacySales = lazy(() => import('./pages/PharmacySales'));
const MedicineReturns = lazy(() => import('./pages/MedicineReturns'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const RoleManagementPanel = lazy(() => import('./pages/RoleManagementPanel'));
const MedicineCreditBills = lazy(() => import('./pages/MedicineCreditBills'));
const MedicineCreditReturns = lazy(() => import('./pages/MedicineCreditReturns'));
const DirectPharmacySales = lazy(() => import('./pages/DirectPharmacySales'));
const DirectMedicineReturns = lazy(() => import('./pages/DirectMedicineReturns'));
const ReturnWorklists = lazy(() => import('./pages/ReturnWorklists'));
const DispenseWorklists = lazy(() => import('./pages/DispenseWorklists'));
const PharmacyAdvances = lazy(() => import('./pages/PharmacyAdvances'));
const ConsolidatedBills = lazy(() => import('./pages/ConsolidatedBills'));
const PharmacyClearance = lazy(() => import('./pages/PharmacyClearance'));
const PendingPrescriptions = lazy(() => import('./pages/PendingPrescriptions'));
const PendingPharmacyReplacement = lazy(() => import('./pages/PendingPharmacyReplacement'));
const PendingReplacementReturns = lazy(() => import('./pages/PendingReplacementReturns'));
const ProductSalesPerformance = lazy(() => import('./pages/ProductSalesPerformance'));
const PendingIndentPrescriptions = lazy(() => import('./pages/PendingIndentPrescriptions'));
const MedicineMaster = lazy(() => import('./pages/MedicineMaster'));
const MedicineStock = lazy(() => import('./pages/MedicineStock'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard'));
const BillingDashboard = lazy(() => import('./pages/BillingDashboard'));
const StorekeeperDashboard = lazy(() => import('./pages/StorekeeperDashboard'));
const MedicalDashboard = lazy(() => import('./pages/MedicalDashboard'));
const SupervisorDashboard = lazy(() => import('./pages/SupervisorDashboard'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Patients = lazy(() => import('./pages/Patients'));
const Reports = lazy(() => import('./pages/Reports'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const PurchaseOrderDetail = lazy(() => import('./pages/PurchaseOrderDetail'));
const LowStockAlerts = lazy(() => import('./pages/LowStockAlerts'));
const ExpiryTracker = lazy(() => import('./pages/ExpiryTracker'));
const DrugInteractions = lazy(() => import('./pages/DrugInteractions'));
const TemperatureLogs = lazy(() => import('./pages/TemperatureLogs'));
const Narcotics = lazy(() => import('./pages/Narcotics'));
const BarcodeScanner = lazy(() => import('./pages/BarcodeScanner'));
const InsuranceClaims = lazy(() => import('./pages/InsuranceClaims'));
const GRNEntry = lazy(() => import('./pages/GRNEntry'));


import AnalyticsLayout from './components/analytics/AnalyticsLayout';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
const ForceChangePasswordPage = lazy(() => import('./pages/ForceChangePasswordPage'));
import ABCAnalysis from './pages/analytics/ABCAnalysis';
import MonthOverMonth from './pages/analytics/MonthOverMonth';
import SupplierAnalytics from './pages/analytics/SupplierAnalytics';
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const RootRedirect = () => {
  const { activeRole, roles, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
      return;
    }

    // Find the first role that has a dashboard route
    const roleToUse = activeRole || (roles && roles[0]) || 'SYSTEM_ADMIN';
    const baseRole = getBaseRoleForUI(roleToUse);
    const target = DASHBOARD_ROUTES[baseRole] || '/dashboard/pharmacy';

    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [loading, isAuthenticated, activeRole, roles, navigate, location.pathname]);

  return null; // render nothing while redirecting
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading PharmaDesk...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
              <BrowserRouter>
                <Toaster position="top-right" reverseOrder={false} />
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Force change password route */}
            <Route path="/force-change-password" element={
              <ProtectedRoute>
                <ForceChangePasswordPage />
              </ProtectedRoute>
            } />

            {/* Main app shell */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<RootRedirect />} />
              
              {/* Role-Specific Dashboards */}
              <Route path="dashboard">
                <Route index element={<RootRedirect />} />
                <Route path="admin"        element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN]}><AdminDashboard /></RoleGuard>} />
                <Route path="supervisor"   element={<RoleGuard allowedRoles={[ROLES.SUPERVISOR]}><AdminDashboard /></RoleGuard>} />
                <Route path="senior-medical" element={<RoleGuard allowedRoles={[ROLES.SENIOR_MEDICAL_STAFF]}><AdminDashboard /></RoleGuard>} />
                <Route path="medical"      element={<RoleGuard allowedRoles={[ROLES.MEDICAL_STAFF]}><AdminDashboard /></RoleGuard>} />
                <Route path="billing"      element={<RoleGuard allowedRoles={[ROLES.BILLING_STAFF]}><AdminDashboard /></RoleGuard>} />
                <Route path="pharmacy"     element={<RoleGuard allowedRoles={[ROLES.PHARMACY_STAFF]}><PharmacyDashboard /></RoleGuard>} />
                <Route path="reception"    element={<RoleGuard allowedRoles={[ROLES.RECEPTIONIST]}><AdminDashboard /></RoleGuard>} />
                <Route path="audit"        element={<RoleGuard allowedRoles={[ROLES.AUDIT_COMPLIANCE]}><AdminDashboard /></RoleGuard>} />
                <Route path="lab"          element={<RoleGuard allowedRoles={[ROLES.LAB_TECHNICIAN]}><AdminDashboard /></RoleGuard>} />
                <Route path="store"        element={<RoleGuard allowedRoles={[ROLES.STOREKEEPER]}><AdminDashboard /></RoleGuard>} />
              </Route>

              {/* Shared Modules */}
              <Route path="medicines" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.SENIOR_MEDICAL_STAFF, ROLES.MEDICAL_STAFF,
                  ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER,
                  ROLES.BILLING_STAFF
                ]}>
                  <MedicineMaster />
                </RoleGuard>
              } />
              <Route path="stocks" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER,
                  ROLES.SENIOR_MEDICAL_STAFF
                ]}>
                  <MedicineStock />
                </RoleGuard>
              } />
              <Route path="sales" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.BILLING_STAFF, ROLES.PHARMACY_STAFF
                ]}>
                  <PharmacySales />
                </RoleGuard>
              } />
              <Route path="returns" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.BILLING_STAFF, ROLES.PHARMACY_STAFF,
                  ROLES.MEDICAL_STAFF, ROLES.SENIOR_MEDICAL_STAFF
                ]}>
                  <MedicineReturns />
                </RoleGuard>
              } />
              <Route path="users" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                  <UserManagement />
                </RoleGuard>
              } />
              <Route path="roles" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                  <RoleManagementPanel />
                </RoleGuard>
              } />
              
              <Route path="credit-bills" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF, ROLES.PHARMACY_STAFF]}><MedicineCreditBills /></RoleGuard>} />
              <Route path="credit-returns" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF, ROLES.PHARMACY_STAFF]}><MedicineCreditReturns /></RoleGuard>} />
              <Route path="direct-sales" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF]}><DirectPharmacySales /></RoleGuard>} />
              <Route path="direct-returns" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF]}><DirectMedicineReturns /></RoleGuard>} />
              <Route path="return-worklists" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF, ROLES.SUPERVISOR]}><ReturnWorklists /></RoleGuard>} />
              <Route path="dispense-worklists" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF]}><DispenseWorklists /></RoleGuard>} />
              <Route path="advances" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF]}><PharmacyAdvances /></RoleGuard>} />
              <Route path="consolidated-bills" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF]}><ConsolidatedBills /></RoleGuard>} />
              <Route path="clearance" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF]}><PharmacyClearance /></RoleGuard>} />
              <Route path="pending-prescriptions" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF]}><PendingPrescriptions /></RoleGuard>} />
              <Route path="pending-replacement" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF]}><PendingPharmacyReplacement /></RoleGuard>} />
              <Route path="pending-replacement-returns" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF]}><PendingReplacementReturns /></RoleGuard>} />
              <Route path="performance" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR]}><ProductSalesPerformance /></RoleGuard>} />
              <Route path="pending-indents" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER]}><PendingIndentPrescriptions /></RoleGuard>} />
              
              <Route path="suppliers" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER]}>
                  <Suppliers />
                </RoleGuard>
              } />
              <Route path="patients" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF, ROLES.RECEPTIONIST]}>
                  <Patients />
                </RoleGuard>
              } />
              <Route path="doctors" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF, ROLES.RECEPTIONIST]}>
                  <Doctors />
                </RoleGuard>
              } />
              <Route path="reports" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR, ROLES.AUDIT_COMPLIANCE]}>
                  <Reports />
                </RoleGuard>
              } />
              
              <Route path="purchase-orders" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER]}>
                  <PurchaseOrders />
                </RoleGuard>
              } />
              <Route path="purchase-orders/:id" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER]}>
                  <PurchaseOrderDetail />
                </RoleGuard>
              } />
              <Route path="low-stock-alerts" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER]}><LowStockAlerts /></RoleGuard>} />
              <Route path="expiry-tracker" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR, ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER]}>
                  <ExpiryTracker />
                </RoleGuard>
              } />
              <Route path="drug-interactions" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF, ROLES.SENIOR_MEDICAL_STAFF, ROLES.MEDICAL_STAFF]}>
                  <DrugInteractions />
                </RoleGuard>
              } />
              <Route path="temperature-logs" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER]}>
                  <TemperatureLogs />
                </RoleGuard>
              } />
              <Route path="narcotics" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR, ROLES.PHARMACY_STAFF]}>
                  <Narcotics />
                </RoleGuard>
              } />
              <Route path="barcode-scanner" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER]}>
                  <BarcodeScanner />
                </RoleGuard>
              } />
              <Route path="insurance-claims" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF]}>
                  <InsuranceClaims />
                </RoleGuard>
              } />
              <Route path="grn" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER]}>
                  <GRNEntry onBack={() => window.history.back()} />
                </RoleGuard>
              } />
              {/* Analytics */}
              <Route path="analytics" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR, ROLES.STOREKEEPER]}>
                  <AnalyticsLayout />
                </RoleGuard>
              }>
                <Route index element={<AnalyticsDashboard />} />
                <Route path="abc" element={<ABCAnalysis />} />
                <Route path="mom" element={<MonthOverMonth />} />
                <Route path="supplier" element={<SupplierAnalytics />} />
              </Route>
              
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="reset-password" element={<ResetPassword />} />

            </Route>

            {/* Redirects */}

                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
            </AuthProvider>
  );
}

export default App;
