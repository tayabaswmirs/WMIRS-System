import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";

function Dashboard() {
  const { currentUser, profileData } = useAuth();
  const displayName = currentUser?.displayName || profileData?.name || "User";

  return (
    <DashboardLayout>
      <div className="dashboard-placeholder">

        {/* Page Header */}
        <div className="dashboard-placeholder__header">
          <span className="dashboard-placeholder__eyebrow">Overview</span>
          <h1 className="dashboard-placeholder__title">
            Welcome back, {displayName} 👋
          </h1>
        </div>

        {/* Main content placeholder */}
        <div className="dashboard-placeholder__content-block" id="dashboard-content-area">
          <div className="dashboard-placeholder__content-icon" aria-hidden="true">
            <span className="material-symbols-outlined">dashboard</span>
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

export default Dashboard;
