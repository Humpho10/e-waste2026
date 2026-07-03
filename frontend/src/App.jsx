// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PermissionRoute from './components/PermissionRoute';

// ─── Public Pages ──────────────────────────────────────────────
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// ─── Regular User Pages ──────────────────────────────────────
import DashboardPage from './pages/DashboardPage';
import BrowsePage from './pages/dashboard/BrowsePage';
import MyListingsPage from './pages/dashboard/MyListingsPage';
import CreateListingPage from './pages/dashboard/CreateListingPage';
import ProductDetailPage from './pages/dashboard/ProductDetailPage';
import MessagesPage from './pages/dashboard/MessagesPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import ResubmitListingPage from './pages/dashboard/ResubmitListingPage';
import UserProfilePage from './pages/dashboard/ProfilePage';
import UserNotificationsPage from './pages/dashboard/NotificationsPage';

// ─── Super Admin Pages ──────────────────────────────────────
import OverviewPage from './pages/admin/OverviewPage';
import AdminsPage from './pages/admin/AdminsPage';
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';
import PermissionsPage from './pages/admin/PermissionsPage';
import AuditPage from './pages/admin/AuditPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminProfilePage from './pages/admin/ProfilePage';
import AdminNotificationsPage from './pages/admin/NotificationsPage';

// ─── Admin / Manager Pages ──────────────────────────────────
import ManagerOverviewPage from './pages/manager/OverviewPage';
import ProductManagersPage from './pages/manager/ProductManagersPage';
import CategoriesPage from './pages/manager/CategoriesPage';
import ProductsPage from './pages/manager/ProductsPage';
import ManagerProfilePage from './pages/manager/ProfilePage';
import ManagerNotificationsPage from './pages/manager/NotificationsPage';
import ManagerMessagesPage from './pages/manager/MessagesPage';
import ManagerUsersPage from './pages/manager/UsersPage';

// ─── Product Manager (Workspace) Pages ──────────────────────
import WorkspaceOverviewPage from './pages/workspace/OverviewPage';
import WorkspaceProductsPage from './pages/workspace/ProductsPage';
import WorkspaceMessagesPage from './pages/workspace/MessagesPage';
import WorkspaceNotificationsPage from './pages/workspace/NotificationsPage';
import WorkspaceProfilePage from './pages/workspace/ProfilePage';

// ─── App (Dynamic Dashboard for New Roles) ──────────────────
import AppPage from './pages/AppPage';
import AppLayout from './layouts/AppLayout';

// ─── Content Components (used inside /app without sidebars) ─
import CategoriesContent from './components/app-content/CategoriesContent';
import ProductsContent from './components/app-content/ProductsContent';
import MessagesContent from './components/app-content/MessagesContent';
import NotificationsContent from './components/app-content/NotificationsContent';
import MyListingsContent from './components/app-content/MyListingsContent';
import CreateListingContent from './components/app-content/CreateListingContent';
import UsersContent from './components/app-content/UsersContent';
import AdminsContent from './components/app-content/AdminsContent';
import RolesContent from './components/app-content/RolesContent';
import PermissionsContent from './components/app-content/PermissionsContent';
import AuditContent from './components/app-content/AuditContent';
import ProductManagersContent from './components/app-content/ProductManagersContent';

import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// ─── Route Guards ────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  return token ? children : <Navigate to="/login" />;
}

function GuestRoute({ children }) {
  const { token, loading, redirectPath } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!token) return children;
  return <Navigate to={redirectPath()} />;
}

// ─── App ──────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Public ────────────────────────────────────────── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* ─── Super Admin ──────────────────────────────────── */}
        <Route path="/admin" element={
          <PermissionRoute requiredPermissions={['dashboard-view', 'user-list']}>
            <OverviewPage />
          </PermissionRoute>
        } />
        <Route path="/admin/admins" element={
          <PermissionRoute requiredPermissions={['admin-list']}>
            <AdminsPage />
          </PermissionRoute>
        } />
        <Route path="/admin/users" element={
          <PermissionRoute requiredPermissions={['user-list']}>
            <UsersPage />
          </PermissionRoute>
        } />
        <Route path="/admin/roles" element={
          <PermissionRoute requiredPermissions={['role-list']}>
            <RolesPage />
          </PermissionRoute>
        } />
        <Route path="/admin/permissions" element={
          <PermissionRoute requiredPermissions={['permission-list']}>
            <PermissionsPage />
          </PermissionRoute>
        } />
        <Route path="/admin/audit" element={
          <PermissionRoute requiredPermissions={['audit-list']}>
            <AuditPage />
          </PermissionRoute>
        } />
        <Route path="/admin/settings" element={
          <PermissionRoute requiredPermissions={['dashboard-view']}>
            <SettingsPage />
          </PermissionRoute>
        } />
        <Route path="/admin/profile" element={
          <PermissionRoute><AdminProfilePage /></PermissionRoute>
        } />
        <Route path="/admin/notifications" element={
          <PermissionRoute requiredPermissions={['notification-view']}>
            <AdminNotificationsPage />
          </PermissionRoute>
        } />

        {/* ─── Manager ──────────────────────────────────────── */}
        <Route path="/manager" element={
          <PermissionRoute requiredPermissions={['dashboard-view', 'product-list']}>
            <ManagerOverviewPage />
          </PermissionRoute>
        } />
        <Route path="/manager/product-managers" element={
          <PermissionRoute requiredPermissions={['pm-list']}>
            <ProductManagersPage />
          </PermissionRoute>
        } />
        <Route path="/manager/categories" element={
          <PermissionRoute requiredPermissions={['category-list']}>
            <CategoriesPage />
          </PermissionRoute>
        } />
        <Route path="/manager/products" element={
          <PermissionRoute requiredPermissions={['product-list']}>
            <ProductsPage />
          </PermissionRoute>
        } />
        <Route path="/manager/profile" element={
          <PermissionRoute><ManagerProfilePage /></PermissionRoute>
        } />
        <Route path="/manager/notifications" element={
          <PermissionRoute requiredPermissions={['notification-view']}>
            <ManagerNotificationsPage />
          </PermissionRoute>
        } />
        <Route path="/manager/messages" element={
          <PermissionRoute requiredPermissions={['message-view']}>
            <ManagerMessagesPage />
          </PermissionRoute>
        } />
        <Route path="/manager/users" element={
          <PermissionRoute requiredPermissions={['user-list']}>
            <ManagerUsersPage />
          </PermissionRoute>
        } />

        {/* ─── Workspace (Product Manager) ──────────────────── */}
        <Route path="/workspace" element={
          <PermissionRoute requiredPermissions={['product-list']}>
            <WorkspaceOverviewPage />
          </PermissionRoute>
        } />
        <Route path="/workspace/products" element={
          <PermissionRoute requiredPermissions={['product-list']}>
            <WorkspaceProductsPage />
          </PermissionRoute>
        } />
        <Route path="/workspace/messages" element={
          <PermissionRoute requiredPermissions={['message-view']}>
            <WorkspaceMessagesPage />
          </PermissionRoute>
        } />
        <Route path="/workspace/notifications" element={
          <PermissionRoute requiredPermissions={['notification-view']}>
            <WorkspaceNotificationsPage />
          </PermissionRoute>
        } />
        <Route path="/workspace/profile" element={
          <PermissionRoute><WorkspaceProfilePage /></PermissionRoute>
        } />

        {/* ─── Regular User ─────────────────────────────────── */}
        <Route path="/dashboard" element={
          <PermissionRoute requiredPermissions={['dashboard-view']}>
            <DashboardPage />
          </PermissionRoute>
        } />
        <Route path="/dashboard/browse" element={
          <ProtectedRoute><BrowsePage /></ProtectedRoute>
        } />
        <Route path="/dashboard/listings" element={
          <PermissionRoute requiredPermissions={['product-list']}>
            <MyListingsPage />
          </PermissionRoute>
        } />
        <Route path="/dashboard/create" element={
          <PermissionRoute requiredPermissions={['product-create']}>
            <CreateListingPage />
          </PermissionRoute>
        } />
        <Route path="/dashboard/product/:id" element={
          <ProtectedRoute><ProductDetailPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/messages" element={
          <PermissionRoute requiredPermissions={['message-view']}>
            <MessagesPage />
          </PermissionRoute>
        } />
        <Route path="/dashboard/notifications" element={
          <PermissionRoute requiredPermissions={['notification-view']}>
            <NotificationsPage />
          </PermissionRoute>
        } />
        <Route path="/dashboard/profile" element={
          <ProtectedRoute><UserProfilePage /></ProtectedRoute>
        } />
        <Route path="/dashboard/resubmit/:id" element={
          <PermissionRoute requiredPermissions={['product-create']}>
            <ResubmitListingPage />
          </PermissionRoute>
        } />

        {/* ─── App (Dynamic Dashboard for New Roles) ────────── */}
        <Route path="/app" element={
          <PermissionRoute requiredPermissions={['dashboard-view']}>
            <AppLayout />
          </PermissionRoute>
        }>
          {/* Index */}
          <Route index element={<AppPage />} />

          {/* ── Category ── */}
          <Route path="category-create" element={<CategoriesContent />} />
          <Route path="category-list"    element={<CategoriesContent />} />
          <Route path="category-edit"    element={<CategoriesContent />} />
          <Route path="category-delete"  element={<CategoriesContent />} />

          {/* ── Product ── */}
          <Route path="product-list"     element={<ProductsContent />} />
          <Route path="product-approve"  element={<ProductsContent />} />
          <Route path="product-reject"   element={<ProductsContent />} />
          <Route path="product-view"     element={<ProductsContent />} />
          <Route path="product-create"   element={<CreateListingContent />} />
          <Route path="product-edit"     element={<MyListingsContent />} />
          <Route path="product-delete"   element={<MyListingsContent />} />

          {/* ── Message ── */}
          <Route path="message-view"     element={<MessagesContent />} />
          <Route path="message-send"     element={<MessagesContent />} />

          {/* ── Notification ── */}
          <Route path="notification-view"        element={<NotificationsContent />} />
          <Route path="notification-mark-read"   element={<NotificationsContent />} />
          <Route path="notification-delete"      element={<NotificationsContent />} />

          {/* ── User Management ── */}
          <Route path="user-list"        element={<UsersContent />} />
          <Route path="user-create"      element={<UsersContent />} />
          <Route path="user-edit"        element={<UsersContent />} />
          <Route path="user-delete"      element={<UsersContent />} />
          <Route path="user-activate"    element={<UsersContent />} />
          <Route path="user-deactivate"  element={<UsersContent />} />

          {/* ── Admin Management ── */}
          <Route path="admin-list"       element={<AdminsContent />} />
          <Route path="admin-create"     element={<AdminsContent />} />
          <Route path="admin-edit"       element={<AdminsContent />} />
          <Route path="admin-delete"     element={<AdminsContent />} />

          {/* ── Role Management ── */}
          <Route path="role-list"        element={<RolesContent />} />
          <Route path="role-create"      element={<RolesContent />} />
          <Route path="role-edit"        element={<RolesContent />} />
          <Route path="role-delete"      element={<RolesContent />} />

          {/* ── Permission Management ── */}
          <Route path="permission-list"  element={<PermissionsContent />} />
          <Route path="permission-create" element={<PermissionsContent />} />
          <Route path="permission-edit"  element={<PermissionsContent />} />
          <Route path="permission-delete" element={<PermissionsContent />} />

          {/* ── Audit ── */}
          <Route path="audit-list"       element={<AuditContent />} />

          {/* ── Product Manager Management ── */}
          <Route path="pm-list"          element={<ProductManagersContent />} />
          <Route path="pm-create"        element={<ProductManagersContent />} />
          <Route path="pm-edit"          element={<ProductManagersContent />} />
          <Route path="pm-delete"        element={<ProductManagersContent />} />
          <Route path="pm-assign-category" element={<ProductManagersContent />} />
          <Route path="pm-remove-category" element={<ProductManagersContent />} />

          {/* ── Dashboard ── */}
          <Route path="dashboard-view"   element={<AppPage />} />

          

          {/* ── Fallback for any unmapped permission ── */}
          <Route path=":permission" element={
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-500 text-sm">
                You don't have permission to view this page.
                <br />
                Please contact your administrator if you believe this is an error.
              </p>
              <button
                onClick={() => window.location.href = '/app'}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                ← Back to Dashboard
              </button>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;