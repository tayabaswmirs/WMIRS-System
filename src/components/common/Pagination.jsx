import { useMemo } from "react";

/**
 * Standardized Pagination component for all data tables across WMIRS dashboards.
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalItems - Total count of matching items
 * @param {number} [props.pageSize=10] - Items per page
 * @param {function(number): void} props.onPageChange - Callback when a page is selected
 * @param {string} [props.itemLabel="records"] - Noun describing the items (e.g., "logs", "incidents", "members")
 */
export default function Pagination({
  currentPage = 1,
  totalItems,
  totalCount,
  totalPages: propTotalPages,
  pageSize = 10,
  onPageChange,
  itemLabel = "records"
}) {
  const count = typeof totalItems === "number" ? totalItems : (typeof totalCount === "number" ? totalCount : 0);
  const totalPages = propTotalPages || Math.max(1, Math.ceil(count / pageSize));

  const startIdx = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, count);

  // Generate intelligent page numbers with ellipsis windowing
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [currentPage, totalPages]);

  if (count === 0) return null;

  return (
    <div className="wmirs-pagination" role="navigation" aria-label="Table pagination">
      {/* ── Left: Range count text ────────────────────── */}
      <div className="wmirs-pagination__info">
        <span className="wmirs-pagination__count">
          Showing <strong>{startIdx}–{endIdx}</strong> of <strong>{count}</strong> {itemLabel}
        </span>
      </div>

      {/* ── Right: Page navigation strip ──────────────── */}
      {totalPages > 1 && (
        <div className="wmirs-pagination__controls">
          {/* Previous page arrow */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="wmirs-pagination__btn wmirs-pagination__btn--arrow"
            aria-label="Previous page"
            title="Previous page"
          >
            <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>

          {/* Numbered pills / Ellipses */}
          {pageNumbers.map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="wmirs-pagination__ellipsis"
                  aria-hidden="true"
                >
                  &hellip;
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                className={`wmirs-pagination__btn wmirs-pagination__btn--page${isCurrent ? " wmirs-pagination__btn--active" : ""}`}
                aria-label={`Go to page ${page}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}

          {/* Next page arrow */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="wmirs-pagination__btn wmirs-pagination__btn--arrow"
            aria-label="Next page"
            title="Next page"
          >
            <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
