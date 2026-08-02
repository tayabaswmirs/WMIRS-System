import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/AdminDashboard";
import AdminIncidents from "../pages/AdminIncidents";
import UserManagement from "../pages/UserManagement";
import Profile from "../pages/Profile";
import Incidents from "../pages/Incidents";
import IncidentHistory from "../pages/IncidentHistory";
import Monitoring from "../pages/Monitoring";
import MonitoringHistory from "../pages/MonitoringHistory";
import AdminMonitoring from "../pages/AdminMonitoring";
import StaffDashboard from "../pages/Staff/StaffDashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../hooks/useAuth";

function HomeRedirect() {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading session status...</p>
      </div>
    );
  }
  
  if (currentUser) {
    if (userRole === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (userRole === "staff") return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      
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
        path="/incidents" 
        element={
          <ProtectedRoute allowedRoles={["ranger"]}>
            <Incidents />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/incidents/history" 
        element={
          <ProtectedRoute allowedRoles={["ranger"]}>
            <IncidentHistory />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/monitoring" 
        element={
          <ProtectedRoute allowedRoles={["ranger"]}>
            <Monitoring />
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

      <Route 
        path="/admin/incidents" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminIncidents />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/monitoring" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoring />
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
  );
}


