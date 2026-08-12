import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Landing from "../pages/Landing";
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
import OpenAssignments from "../pages/OpenAssignments";
import { ProtectedRoute } from "./ProtectedRoute";

export default function AppRoutes() {
  return (
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
      
      {/* ── Operational Submission & History Routes ────────────── */}
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
          <ProtectedRoute allowedRoles={["ranger", "staff", "admin"]}>
            <Incidents />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/incidents/history" 
        element={
          <ProtectedRoute allowedRoles={["ranger", "staff", "admin"]}>
            <IncidentHistory />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/monitoring" 
        element={
          <ProtectedRoute allowedRoles={["ranger", "staff", "admin"]}>
            <Monitoring />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/monitoring/history" 
        element={
          <ProtectedRoute allowedRoles={["ranger", "staff", "admin"]}>
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


