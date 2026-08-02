import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Route guard supporting the 3-tier RBAC system (ranger, staff, admin).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Page component to render if authorized
 * @param {string[]} props.allowedRoles - Roles permitted to access this route
 * @param {string} [props.requiredScope] - Optional domain scope required for Staff routes
 */
export function ProtectedRoute({ children, allowedRoles, requiredScope }) {
  const { currentUser, userRole, staffScope, loading } = useAuth();

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
    const fallbackPath = userRole === "admin"
      ? "/admin/dashboard"
      : userRole === "staff"
        ? "/staff/dashboard"
        : "/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  // Enforce Staff domain scope isolation when a specific scope is required
  if (requiredScope && userRole === "staff" && staffScope !== requiredScope) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
}


