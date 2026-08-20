import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import SubmitDashboard from "../pages/SubmitDashboard";
import IncidentHistory from "../pages/IncidentHistory";
import MonitoringHistory from "../pages/MonitoringHistory";
import OpenAssignments from "../pages/OpenAssignments";
import { ProtectedRoute } from "./ProtectedRoute";

const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const AdminIncidents = lazy(() => import("../pages/AdminIncidents"));
const AdminIncidentsAnalytics = lazy(() => import("../pages/AdminIncidentsAnalytics"));
const AdminMonitoring = lazy(() => import("../pages/AdminMonitoring"));
const AdminMonitoringCategoryLogs = lazy(() => import("../pages/AdminMonitoringCategoryLogs"));
const AdminMonitoringCategoryAnalytics = lazy(() => import("../pages/AdminMonitoringCategoryAnalytics"));
const UserManagement = lazy(() => import("../pages/UserManagement"));
const StaffDashboard = lazy(() => import("../pages/Staff/StaffDashboard"));
const StaffStageWorkspace = lazy(() => import("../pages/Staff/StaffStageWorkspace"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#001e2b] text-[#00ed64] font-medium">Loading interface...</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      {/* ── Shared Routes ──────────────────────────────── */}
      <Route 
        path="/assignments" 
        element={
          <ProtectedRoute allowedRoles={["ranger", "staff", "admin"]}>
            <OpenAssignments />
          </ProtectedRoute>
        } 
      />
      
      {/* ── Forest Ranger Routes ──────────────────────────────── */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={["ranger"]}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/submit" 
        element={
          <ProtectedRoute allowedRoles={["ranger"]}>
            <SubmitDashboard />
          </ProtectedRoute>
        } 
      />

      <Route path="/incidents" element={<Navigate to="/submit" replace />} />
      <Route path="/monitoring" element={<Navigate to="/submit" replace />} />

      <Route 
        path="/incidents/history" 
        element={
          <ProtectedRoute allowedRoles={["ranger"]}>
            <IncidentHistory />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/monitoring/history" 
        element={
          <ProtectedRoute allowedRoles={["ranger"]}>
            <MonitoringHistory />
          </ProtectedRoute>
        } 
      />

      {/* ── Staff Routes (Phase 4) ────────────── */}
      <Route 
        path="/staff/dashboard" 
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/staff/workspace/:stageId" 
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffStageWorkspace />
          </ProtectedRoute>
        } 
      />

      {/* ── Admin Routes ──────────────────────────────────────── */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />

      {/* Admin Incidents Subroutes */}
      <Route 
        path="/admin/incidents" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminIncidents />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/incidents/logs" 
        element={<Navigate to="/admin/incidents" replace />} 
      />
      <Route 
        path="/admin/incidents/analytics" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminIncidentsAnalytics />
          </ProtectedRoute>
        } 
      />

      {/* Admin Monitoring Subroutes */}
      <Route 
        path="/admin/monitoring" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoring />
          </ProtectedRoute>
        } 
      />

      {/* BMS */}
      <Route 
        path="/admin/monitoring/bms/logs" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoringCategoryLogs category="BMS" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/monitoring/bms/analytics" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoringCategoryAnalytics category="BMS" />
          </ProtectedRoute>
        } 
      />

      {/* Water */}
      <Route 
        path="/admin/monitoring/water/logs" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoringCategoryLogs category="Water" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/monitoring/water/analytics" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoringCategoryAnalytics category="Water" />
          </ProtectedRoute>
        } 
      />

      {/* Compliance */}
      <Route 
        path="/admin/monitoring/compliance/logs" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoringCategoryLogs category="Compliance" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/monitoring/compliance/analytics" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoringCategoryAnalytics category="Compliance" />
          </ProtectedRoute>
        } 
      />

      {/* ── Shared Routes ─────────────────────────────────────── */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute allowedRoles={["ranger", "staff", "admin"]}>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
