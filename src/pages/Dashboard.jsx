import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { subscribeToReporterIncidents } from "../firebase/services/incidentService";
import DashboardLayout from "../components/layout/DashboardLayout";

function Dashboard() {
  const { currentUser, profileData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, verified: 0, completed: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = currentUser?.displayName || profileData?.name || "User";

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Load recent reports and compute stats in real-time
    const unsubscribe = subscribeToReporterIncidents(currentUser.uid, (reports) => {
      // Single-pass reducer to calculate stats following client-side best practices
      const computedStats = reports.reduce((acc, r) => {
        const status = r.status?.toLowerCase();
        acc.total += 1;
        if (status === "assigned" || status === "unresolved") {
          acc.active += 1;
        } else if (status === "resolved") {
          acc.resolved += 1;
        } else if (status === "verified" || status === "pending completion") {
          acc.verified += 1;
        } else if (status === "completed") {
          acc.completed += 1;
        }
        return acc;
      }, { total: 0, active: 0, resolved: 0, verified: 0, completed: 0 });

      setStats(computedStats);
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
            <h2 className="dashboard-cta-card__title">Field Operations</h2>
            <p className="dashboard-cta-card__desc">
              Help protect Tayabas' ecosystem. Submit comprehensive incident reports or log scheduled ecological monitoring data.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/incidents")}
                className="button-primary"
                id="dashboard-report-cta-btn"
                type="button"
              >
                Report New Incident
              </button>
              <button
                onClick={() => navigate("/monitoring")}
                className="button-primary"
                id="dashboard-monitoring-cta-btn"
                type="button"
                style={{ backgroundColor: "var(--c-teal-dark, #001e2b)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Log Ecological Monitoring
              </button>
            </div>
          </div>

          {/* Stats Column - structured as a responsive subgrid */}
          <div className="dashboard-stats-col" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon" style={{ color: "#3d8eff" }}>upload_file</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Total Submitted</span>
                <span className="stat-card__val">{loading ? "..." : stats.total}</span>
              </div>
            </div>

            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon" style={{ color: "#fa6e39" }}>assignment_late</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Active Tasks</span>
                <span className="stat-card__val">{loading ? "..." : stats.active}</span>
              </div>
            </div>

            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon" style={{ color: "#00a35c" }}>pending_actions</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Pending Verification</span>
                <span className="stat-card__val">{loading ? "..." : stats.resolved}</span>
              </div>
            </div>

            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon" style={{ color: "#7b3ff2" }}>verified</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Pending Completion</span>
                <span className="stat-card__val">{loading ? "..." : stats.verified}</span>
              </div>
            </div>

            <div className="card-base stat-card">
              <span className="material-symbols-outlined stat-card__icon" style={{ color: "#00ed64" }}>task_alt</span>
              <div className="stat-card__content">
                <span className="stat-card__label">Completed Cases</span>
                <span className="stat-card__val">{loading ? "..." : stats.completed}</span>
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
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("/incidents/history")}
                  className="button-ghost recent-reports-panel__view-all"
                  type="button"
                >
                  View Incident History →
                </button>
                <button
                  onClick={() => navigate("/monitoring/history")}
                  className="button-ghost recent-reports-panel__view-all"
                  type="button"
                >
                  View Monitoring History →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
