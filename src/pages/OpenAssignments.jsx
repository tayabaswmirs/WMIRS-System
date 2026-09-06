import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import AssignmentHero from "../components/common/AssignmentHero";
import AssignmentFilterToolbar from "../components/common/AssignmentFilterToolbar";
import AssignmentCard from "../components/common/AssignmentCard";
import AssignmentModals from "../components/common/AssignmentModals";
import { subscribeToOpenAssignments, resolveAssignmentByRanger } from "../firebase/services/incidentService";
import "../styles/dashboard.css";
import "../styles/workflow.css";

/**
 * OpenAssignments — Orchestration page for field patrol assignments.
 */
function OpenAssignments() {
  const { currentUser, userRole, staffScope } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const scope = userRole === "staff" ? staffScope : null;
    const unsubscribe = subscribeToOpenAssignments(setAssignments, scope);
    return () => unsubscribe && unsubscribe();
  }, [userRole, staffScope]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const incident = assignments.filter((r) => r.logType === "Incident").length;
    const monitoring = assignments.filter((r) => r.logType === "Monitoring").length;
    const leading = assignments.filter((r) => r.assignedTeam?.leader?.uid === currentUser?.uid).length;
    const assisting = assignments.filter((r) => r.assignedTeam?.members?.some((m) => m.uid === currentUser?.uid)).length;
    return { total, incident, monitoring, leading, assisting };
  }, [assignments, currentUser]);

  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (activeType !== "All") list = list.filter((a) => a.logType === activeType);
    if (userRole === "ranger" && roleFilter === "Leading") {
      list = list.filter((a) => a.assignedTeam?.leader?.uid === currentUser?.uid);
    } else if (userRole === "ranger" && roleFilter === "Assisting") {
      list = list.filter((a) => a.assignedTeam?.members?.some((m) => m.uid === currentUser?.uid));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => 
        a.category?.toLowerCase().includes(q) || a.subcategory?.toLowerCase().includes(q) ||
        a.incidentType?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [assignments, activeType, roleFilter, searchQuery, userRole, currentUser]);

  const handleResolveSubmit = async ({ resolutionNotes, evidenceFile }) => {
    if (!selectedAssignment) return;
    try {
      setIsResolving(true);
      await resolveAssignmentByRanger(
        selectedAssignment.id, selectedAssignment.logType,
        currentUser.uid, currentUser.displayName || "Ranger",
        resolutionNotes, evidenceFile
      );
      setResolutionModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error("Failed to resolve assignment:", error);
      alert(error.message || "Failed to submit resolution. Check console.");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="incidents-page">
        <AssignmentHero stats={stats} userRole={userRole} />

        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">Available Assignments</h2>
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

          <AssignmentFilterToolbar
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            activeType={activeType}
            onTypeFilterChange={setActiveType}
            stats={stats}
            userRole={userRole}
          />

          <div className="assignments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--c-bg-subtle)' }}>
            {filteredAssignments.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e1e5e8' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#a8b3bc' }}>assignment_turned_in</span>
                <p style={{ marginTop: '0.75rem', color: '#5c6c7a', fontSize: '14px' }}>No field assignments match your current filters.</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  currentUser={currentUser}
                  userRole={userRole}
                  onSelect={(item) => setSelectedAssignment(item)}
                  onResolve={(item) => {
                    setSelectedAssignment(item);
                    setResolutionModalOpen(true);
                  }}
                />
              ))
            )}
          </div>

          <AssignmentModals
            selectedAssignment={selectedAssignment}
            setSelectedAssignment={setSelectedAssignment}
            resolutionModalOpen={resolutionModalOpen}
            setResolutionModalOpen={setResolutionModalOpen}
            onResolveSubmit={handleResolveSubmit}
            currentUser={currentUser}
            isResolving={isResolving}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OpenAssignments;
