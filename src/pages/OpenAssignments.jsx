import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import RangerResolutionModal from "../components/common/RangerResolutionModal";
import IncidentDetailsModal from "../components/common/IncidentDetailsModal";
import MonitoringDetailsModal from "../components/common/monitoring/MonitoringDetailsModal";
import { getSeverityClass } from "../utils/incidentConstants";
import { subscribeToOpenAssignments, resolveAssignmentByRanger } from "../firebase/services/incidentService"; // Will implement next
import StatPill from "../components/common/StatPill";
import "../styles/dashboard.css";
import "../styles/workflow.css"; // ensure workflow styles are loaded

function OpenAssignments() {
  const { currentUser, userRole, staffScope } = useAuth();
  
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Pass staffScope if user is staff to restrict query correctly
    const scopeToPass = userRole === "staff" ? staffScope : null;
    const unsubscribe = subscribeToOpenAssignments(setAssignments, scopeToPass);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userRole, staffScope]);

  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (activeFilter !== "All") {
      list = assignments.filter((a) => a.logType === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => 
        a.category?.toLowerCase().includes(q) ||
        a.subcategory?.toLowerCase().includes(q) ||
        a.incidentType?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [assignments, activeFilter, searchQuery]);

  const stats = useMemo(() => ({
    total:       assignments.length,
    incident:    assignments.filter((r) => r.logType === "Incident").length,
    monitoring:  assignments.filter((r) => r.logType === "Monitoring").length,
  }), [assignments]);

  const handleResolveSubmit = async ({ resolutionNotes, evidenceFile }) => {
    if (!selectedAssignment) return;
    try {
      // Pass the required fields to backend
      await resolveAssignmentByRanger(selectedAssignment.id, selectedAssignment.logType, currentUser.uid, currentUser.displayName, resolutionNotes, evidenceFile);
      setResolutionModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error("Failed to resolve assignment:", error);
      alert("Failed to submit resolution. Check console.");
    }
  };

  const getLatestStaffRemark = (history) => {
    if (!history || !Array.isArray(history)) return "No specific instructions provided by Staff.";
    const staffRemarks = history.filter(h => (h.notes || h.remarks) && ["assigned", "unresolved"].includes((h.toStatus || h.action)?.toLowerCase()));
    if (staffRemarks.length === 0) return "No specific instructions provided by Staff.";
    const last = staffRemarks[staffRemarks.length - 1];
    return last.notes || last.remarks;
  };

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* ── Hero Header Band ─────────────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Field Operations</span>
            <h1 className="inc-hero__title">Open Assignments</h1>
            <p className="inc-hero__subtitle">
              Claim and resolve field tasks assigned to rangers.
            </p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="assignment"     label="Total Tasks" count={stats.total}       color="var(--brand-green, #00ed64)" />
            <StatPill icon="warning" label="Incidents"  count={stats.incident}   color="#f5a524" />
            <StatPill icon="visibility"  label="Monitoring" count={stats.monitoring} color="#3d8eff" />
          </div>
        </div>

        {/* ── Assignments Card ──────────────────────────────── */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">Available Assignments</h2>
            {/* Search input */}
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                id="assignments-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="inc-search-input"
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="inc-filter-tabs" role="tablist" aria-label="Filter assignments by type">
            {["All", "Incident", "Monitoring"].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeFilter === tab}
                onClick={() => setActiveFilter(tab)}
                className={`inc-filter-tab${activeFilter === tab ? " inc-filter-tab--active" : ""}`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="assignments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--c-bg-subtle)' }}>
        {filteredAssignments.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#a8b3bc' }}>assignment_turned_in</span>
            <p style={{ marginTop: '1rem', color: '#5c6c7a' }}>No open assignments at the moment.</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="card assignment-card" style={{ padding: '1rem', border: '1px solid #e1e5e8', borderRadius: '8px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className={`status-badge ${getSeverityClass(assignment.severity)}`} style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                  {assignment.severity || "Standard"}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#5c6c7a' }}>
                  {assignment.createdAt?.toDate 
                    ? assignment.createdAt.toDate().toLocaleDateString()
                    : assignment.createdAt?.seconds 
                      ? new Date(assignment.createdAt.seconds * 1000).toLocaleDateString()
                      : new Date(assignment.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#001e2b' }}>
                {assignment.subcategory || assignment.incidentType || assignment.category}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#5c6c7a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span>
                {assignment.location}
              </p>

              <div className="remarks-callout" style={{ padding: '0.75rem', marginTop: 'auto', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#001e2b', marginBottom: '0.25rem' }}>Task Instructions:</div>
                <p style={{ fontSize: '0.8rem', color: '#1c2d38', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {getLatestStaffRemark(assignment.history || assignment.workflowHistory)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  View Details
                </button>
                {userRole === "ranger" && (
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setResolutionModalOpen(true);
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <RangerResolutionModal 
        isOpen={resolutionModalOpen}
        onClose={() => {
          setResolutionModalOpen(false);
          setSelectedAssignment(null);
        }}
        onSubmit={handleResolveSubmit}
      />

      {/* For View Details, we use existing modal but need to wire it up properly based on logType */}
      {selectedAssignment && !resolutionModalOpen && selectedAssignment.logType === "Incident" && (
        <IncidentDetailsModal 
          incident={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          // we can pass down callbacks here if needed, but this page mainly views
        />
      )}
      
      {selectedAssignment && !resolutionModalOpen && selectedAssignment.logType === "Monitoring" && (
        <MonitoringDetailsModal 
          log={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OpenAssignments;
