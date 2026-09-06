import PendingQueueRow from "./PendingQueueRow";

/**
 * PendingQueueTable — Displays the unified table of logs pending admin validation.
 *
 * @param {Object} props
 * @param {Array<Object>} props.items - Normalized items for the active page
 * @param {function(Object): void} props.onRowClick - Row selection callback (opens drawer)
 * @param {function(Object, string): void} props.onQuickAction - Action trigger callback ("complete" | "dispute")
 * @param {string} props.searchQuery - Current search query for empty state messaging
 */
export default function PendingQueueTable({
  items,
  onRowClick,
  onQuickAction,
  searchQuery
}) {
  if (items.length === 0) {
    return (
      <div className="inc-empty-state" style={{ padding: "40px 20px" }}>
        <span
          className="material-symbols-outlined inc-empty-state__icon"
          style={{ color: searchQuery ? "var(--c-stone)" : "var(--brand-green, #00ed64)" }}
        >
          {searchQuery ? "content_paste_search" : "check_circle"}
        </span>
        <p className="inc-empty-state__text" style={{ fontWeight: 600, color: "var(--c-ink)" }}>
          {searchQuery
            ? `No pending logs match "${searchQuery}".`
            : "All caught up! No logs currently awaiting completion validation."}
        </p>
        <span style={{ fontSize: "12px", color: "var(--c-stone)" }}>
          {searchQuery ? "Try refining your search term or tab filter." : "Verified incident and monitoring logs will appear here for final sign-off."}
        </span>
      </div>
    );
  }

  return (
    <div className="inc-table-wrap" style={{ border: "none", margin: 0 }}>
      <table className="inc-table">
        <thead className="inc-table__head">
          <tr>
            <th className="inc-table__th">Domain</th>
            <th className="inc-table__th">Title / Type</th>
            <th className="inc-table__th">Location</th>
            <th className="inc-table__th">Ranger Resolution Notes</th>
            <th className="inc-table__th">Reported Date</th>
            <th className="inc-table__th inc-table__th--action" style={{ textAlign: "right" }}>Validation Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <PendingQueueRow
              key={`${item.domain}-${item.id}`}
              item={item}
              idx={idx}
              onRowClick={onRowClick}
              onQuickAction={onQuickAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
