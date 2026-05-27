import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading session status...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Enforce role authorization boundaries if allowedRoles are specified
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const fallbackPath = userRole === "admin" ? "/admin/dashboard" : "/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

