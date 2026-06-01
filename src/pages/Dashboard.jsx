import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { subscribeToReporterIncidents } from "../firebase/services/incidentService";
import DashboardLayout from "../components/layout/DashboardLayout";

function Dashboard() {
  const { currentUser, profileData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = currentUser?.displayName || profileData?.name || "User";

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Load recent reports and compute stats in real-time
    const unsubscribe = subscribeToReporterIncidents(currentUser.uid, (reports) => {
      const pendingCount = reports.filter((r) => r.status === "Submitted" || r.status === "Under Review").length;
      const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

      setStats({
        total: reports.length,
        pending: pendingCount,
        resolved: resolvedCount,
      });
      setRecentReports(reports.slice(0, 3));
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser?.uid]);

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "severity-critical";
      case "high": return "severity-high";
      case "medium": return "severity-medium";
      default: return "severity-low";
    }
  };

  return (
    <DashboardLayout>
      <div className="dashboard-view">
        {/* Page Header */}
        <div className="dashboard-view__header">
          <span className="dashboard-view__eyebrow">Overview</span>
          <h1 className="dashboard-view__title">Welcome back, {displayName} 👋</h1>
        </div>

        {/* Action Panel & Stats Grid */}
        <div className="dashboard-grid">
          {/* CTA Reporting Card */}
          <div className="card-feature-dark dashboard-cta-card">
            <h2 className="dashboard-cta-card__title">Incident Reporting</h2>
            <p className="dashboard-cta-card__desc">
              Help protect Tayabas' ecosystem. Submit comprehensive logs of logging, waste dumping, wildlife tracking, and environmental permit violations.
            </p>
            <button
              onClick={() => navigate("/incidents")}
              className="button-primary"
              id="dashboard-report-cta-btn"
              type="button"
            >
              Report New Incident
            </button>
          </div>

          {/* Stats Column */}
          <div className="dashboard-stats-col">
            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon text-accent">report</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Total Submitted</span>
                <span className="stat-card__val">{loading ? "..." : stats.total}</span>
              </div>
            </div>

            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon text-warning">pending_actions</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Pending Action</span>
                <span className="stat-card__val">{loading ? "..." : stats.pending}</span>
              </div>
            </div>

            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon text-success">task_alt</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Resolved Cases</span>
                <span className="stat-card__val">{loading ? "..." : stats.resolved}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Incidents List */}
        <div className="card-base recent-reports-panel">
          <h2 className="recent-reports-panel__title">Your Recent Submissions</h2>
          {loading ? (
            <p className="loading-text">Loading recent logs...</p>
          ) : recentReports.length === 0 ? (
            <div className="empty-logs-placeholder">
              <span className="material-symbols-outlined empty-icon">assignment_late</span>
              <p className="empty-text">No incidents reported yet.</p>
              <button 
                onClick={() => navigate("/incidents")} 
                className="button-link"
                type="button"
              >
                File your first incident report
              </button>
            </div>
          ) : (
            <div className="recent-reports-list">
              {recentReports.map((report) => (
                <div key={report.id} className="recent-report-item">
                  <div className="recent-report-item__main">
                    <span className="recent-report-item__title">{report.incidentType}</span>
                    <span className="recent-report-item__meta">
                      {report.category} • {report.location}
                    </span>
                  </div>
                  <div className="recent-report-item__badges">
                    <span className={`severity-badge ${getSeverityClass(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`status-badge status-${report.status?.toLowerCase().replace(" ", "-")}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate("/incidents")}
                className="button-ghost recent-reports-panel__view-all"
                type="button"
              >
                View Report History & Evidence →
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
