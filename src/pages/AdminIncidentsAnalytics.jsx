import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatPill from "../components/common/StatPill";
import IncidentsAnalyticsView from "../components/common/analytics/IncidentsAnalyticsView";
import { subscribeToAllIncidents } from "../firebase/services/incidentService";
import "../styles/dashboard.css";

export default function AdminIncidentsAnalytics() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllIncidents((data) => {
      setIncidents(data);
      setLoading(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    incidents.forEach((item) => {
      const s = item.status?.toLowerCase();
      if (s === "completed") completed++;
      else if (s === "resolved" || s === "verified" || s === "pending completion") pending++;
    });
    return { completed, pending, total: incidents.length };
  }, [incidents]);

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* Hero Header */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Intelligence & Audits</span>
            <h1 className="inc-hero__title">Incidents Analytics</h1>
            <p className="inc-hero__subtitle">
              Comprehensive threat classification, response velocity, and severity distribution across all operational zones.
            </p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="task_alt" label="Completed" count={stats.completed} color="#00ed64" />
            <StatPill icon="pending_actions" label="In Verification" count={stats.pending} color="#00a35c" />
            <StatPill icon="warning" label="Total" count={stats.total} color="#3d8eff" />
          </div>
        </div>

        {loading ? (
          <p className="loading-text" style={{ padding: "64px", textAlign: "center", color: "var(--c-steel)" }}>
            Loading incidents analytics...
          </p>
        ) : (
          <IncidentsAnalyticsView items={incidents} />
        )}
      </div>
    </DashboardLayout>
  );
}
