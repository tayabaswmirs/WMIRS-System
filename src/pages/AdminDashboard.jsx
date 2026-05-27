import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";

function AdminDashboard() {
  const { currentUser, profileData } = useAuth();
  const displayName = currentUser?.displayName || profileData?.name || "Administrator";

  return (
    <DashboardLayout pageTitle="Admin Dashboard">
      <div className="dashboard-placeholder">

        {/* Page Header */}
        <div className="dashboard-placeholder__header">
          <span className="dashboard-placeholder__eyebrow">Administration</span>
          <h1 className="dashboard-placeholder__title">
            Admin Portal — {displayName}
          </h1>
        </div>

        {/* Admin content placeholder */}
        <div className="dashboard-placeholder__content-block" id="admin-content-area">
          <div className="dashboard-placeholder__content-icon" aria-hidden="true">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <h2 className="dashboard-placeholder__content-title">
            Dashboard
          </h2>
          <p className="dashboard-placeholder__content-desc">
            Dashboard coming soon.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
