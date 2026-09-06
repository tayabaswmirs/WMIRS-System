/**
 * PendingQueuePagination — Responsive page navigation controls for the pending queue.
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total count of matching items
 * @param {number} props.pageSize - Number of items per page
 * @param {function(number): void} props.onPageChange - Handler for page navigation
 */
export default function PendingQueuePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}) {
  if (totalItems <= pageSize) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pending-queue-pagination" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      borderTop: "1px solid var(--c-hairline)",
      backgroundColor: "var(--c-surface)"
    }}>
      <span style={{ fontSize: "13px", color: "var(--c-stone)" }}>
        Showing <strong style={{ color: "var(--c-ink)" }}>{startIdx}–{endIdx}</strong> of <strong style={{ color: "var(--c-ink)" }}>{totalItems}</strong> pending logs
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inc-table__view-btn"
          aria-label="Previous Page"
          title="Previous Page"
          style={{ opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
        </button>

        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--c-steel)", padding: "0 6px" }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inc-table__view-btn"
          aria-label="Next Page"
          title="Next Page"
          style={{ opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
        </button>
      </div>
    </div>
  );
}
