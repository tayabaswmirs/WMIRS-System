import { useState, useMemo } from "react";
import ChartCard from "./ChartCard";
import PendingQueueHeader from "./PendingQueueHeader";
import PendingQueueTable from "./PendingQueueTable";
import PendingQueuePagination from "./PendingQueuePagination";

const PAGE_SIZE = 5;

/**
 * Normalizes an incident into a uniform queue item shape.
 */
const normalizeIncident = (inc) => ({
  id: inc.id,
  domain: "incident",
  title: inc.incidentType || "Incident Report",
  category: inc.category || "General",
  location: inc.location || "—",
  reporterName: inc.reporter?.name || "Ranger",
  date: inc.createdAt || inc.dateTime,
  resolutionNotes: inc.resolutionNotes || null,
  hasEvidence: Boolean(inc.resolutionEvidence || inc.evidence?.length),
  raw: inc
});

/**
 * Normalizes a monitoring log into a uniform queue item shape.
 */
const normalizeMonitoring = (log) => ({
  id: log.id,
  domain: "monitoring",
  title: log.subcategory || log.category || "Monitoring Observation",
  category: log.category || "Monitoring",
  location: log.barangay || log.stationId || log.waterBody || "—",
  reporterName: log.reporter?.name || "Ranger",
  date: log.createdAt || log.dateTime,
  resolutionNotes: log.resolutionNotes || null,
  hasEvidence: Boolean(log.resolutionEvidence || log.evidence?.length),
  raw: log
});

/**
 * PendingCompletionQueue — Central executive work queue for logs awaiting Admin validation.
 */
export default function PendingCompletionQueue({
  incidents = [],
  logs = [],
  onSelectIncident,
  onSelectMonitoring,
  onQuickAction
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Normalize pending items
  const pendingIncidents = useMemo(() => (
    incidents
      .filter((i) => ["verified", "pending completion"].includes(i.status?.toLowerCase()))
      .map(normalizeIncident)
  ), [incidents]);

  const pendingLogs = useMemo(() => (
    logs
      .filter((l) => ["verified", "pending completion"].includes(l.status?.toLowerCase()))
      .map(normalizeMonitoring)
  ), [logs]);

  const allPending = useMemo(() => (
    [...pendingIncidents, ...pendingLogs].sort((a, b) => {
      const timeA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date || 0).getTime();
      const timeB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date || 0).getTime();
      return timeB - timeA;
    })
  ), [pendingIncidents, pendingLogs]);

  // Tab & search filtering
  const filteredItems = useMemo(() => {
    let list = allPending;
    if (activeTab === "incident") list = pendingIncidents;
    if (activeTab === "monitoring") list = pendingLogs;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.reporterName.toLowerCase().includes(q) ||
      (item.resolutionNotes && item.resolutionNotes.toLowerCase().includes(q))
    ));
  }, [allPending, pendingIncidents, pendingLogs, activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const handleRowClick = (item) => {
    if (item.domain === "incident") {
      onSelectIncident(item.raw);
    } else {
      onSelectMonitoring(item.raw);
    }
  };

  return (
    <div className="dash-full-width-row" style={{ marginTop: "var(--sp-xl)" }}>
      <ChartCard
        icon="pending_actions"
        title="Pending Completion Queue"
        subtitle="Unified incident and monitoring reports awaiting final administrative validation"
        accentColor="var(--c-accent-purple, #7b3ff2)"
        extraHeader={
          <PendingQueueHeader
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setCurrentPage(1); }}
            counts={{
              all: allPending.length,
              incident: pendingIncidents.length,
              monitoring: pendingLogs.length
            }}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
          />
        }
      >
        <PendingQueueTable
          items={paginatedItems}
          onRowClick={handleRowClick}
          onQuickAction={onQuickAction}
          searchQuery={searchQuery}
        />
        <PendingQueuePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </ChartCard>
    </div>
  );
}
