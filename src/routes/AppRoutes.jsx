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
    return userRole === "admin" 
      ? <Navigate to="/admin/dashboard" replace /> 
      : <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/incidents" 
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Incidents />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/incidents/history" 
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <IncidentHistory />
          </ProtectedRoute>
        } 
      />

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
        path="/profile" 
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <Profile />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/monitoring" 
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Monitoring />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/monitoring/history" 
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <MonitoringHistory />
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

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

