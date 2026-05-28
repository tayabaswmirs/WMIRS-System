import { useState } from "react";

/** Number of rows to show per page. */
const PAGE_SIZE = 5;

/**
 * Formats a Firestore Timestamp or general Date object into a readable string.
 * @param {object|string|number} timestamp
 * @returns {string}
 */
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year:   "numeric",
      month:  "short",
      day:    "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

/**
 * Derives up to 2 uppercase initials from a display name.
 * @param {string} name
 * @returns {string}
 */
const getInitials = (name) =>
  (name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="um-empty-state" role="status">
      <div className="um-empty-state__icon-wrap">
        <span className="material-symbols-outlined um-empty-state__icon" aria-hidden="true">
          group_off
        </span>
      </div>
      <h3 className="um-empty-state__title">No staff members found</h3>
      <p className="um-empty-state__desc">
        Try adjusting your search criteria or register a new staff member.
      </p>
    </div>
  );
}

// ─── Single Table Row ─────────────────────────────────────────────────────────

function UserRow({ user, currentAdminUid, onEdit, onToggleRole, onDelete, isEven }) {
  const isAdmin     = user.role === "admin";
  const isSelf      = user.uid === currentAdminUid;
  const displayName = user.name || "User";
  const initials    = getInitials(displayName);
  const cannotModifyRole = isSelf || isAdmin;
  const cannotDelete = isSelf || isAdmin;

  return (
    <tr
      className={`um-table__row${isEven ? " um-table__row--even" : ""}`}
      role="row"
    >
      {/* ── Staff Member: avatar + name ──────────────────────── */}
      <td className="um-table__cell um-table__cell--name">
        <div className="um-table__name-cell">
          <div
            className={`um-table__avatar ${isAdmin ? "um-table__avatar--admin" : "um-table__avatar--staff"}`}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="um-table__name-text">
            {displayName}
            {isSelf && (
              <span className="um-self-tag" aria-label="This is you">You</span>
            )}
          </div>
        </div>
      </td>

      {/* ── Email ────────────────────────────────────────────── */}
      <td className="um-table__cell um-table__cell--email">
        <span className="um-table__email">{user.email}</span>
      </td>

      {/* ── System Role badge ────────────────────────────────── */}
      <td className="um-table__cell um-table__cell--role">
        {isAdmin ? (
          <span className="um-role-badge um-role-badge--admin">
            <span className="um-role-badge__dot" aria-hidden="true" />
            Administrator
          </span>
        ) : (
          <span className="um-role-badge um-role-badge--staff">
            <span className="um-role-badge__dot" aria-hidden="true" />
            ENRO Staff
          </span>
        )}
      </td>

      {/* ── Registered On ────────────────────────────────────── */}
      <td className="um-table__cell um-table__cell--date">
        {formatDate(user.createdAt)}
      </td>

      {/* ── Actions ──────────────────────────────────────────── */}
      <td className="um-table__cell um-table__cell--actions">
        <div className="um-table__actions">

          <button
            id={`um-edit-btn-${user.uid}`}
            type="button"
            className="um-action-btn um-action-btn--edit"
            onClick={() => onEdit(user)}
            title="Edit credentials"
          >
            <span className="material-symbols-outlined um-action-btn__icon" aria-hidden="true">edit</span>
            <span className="um-action-btn__label">Edit</span>
          </button>

          <button
            id={`um-role-btn-${user.uid}`}
            type="button"
            className={`um-action-btn ${
              cannotModifyRole
                ? "um-action-btn--disabled"
                : isAdmin
                ? "um-action-btn--demote"
                : "um-action-btn--promote"
            }`}
            onClick={() => onToggleRole(user)}
            disabled={cannotModifyRole}
            title={
              isSelf
                ? "Self-role changes are blocked"
                : isAdmin
                ? "Administrators cannot demote other administrators"
                : "Grant admin privileges"
            }
            aria-disabled={cannotModifyRole}
          >
            <span className="material-symbols-outlined um-action-btn__icon" aria-hidden="true">
              {isAdmin ? "shield_person" : "verified_user"}
            </span>
            <span className="um-action-btn__label">
              {isAdmin ? "Demote" : "Promote"}
            </span>
          </button>

          <button
            id={`um-delete-btn-${user.uid}`}
            type="button"
            className={`um-action-btn ${cannotDelete ? "um-action-btn--disabled" : "um-action-btn--delete"}`}
            onClick={() => onDelete(user)}
            disabled={cannotDelete}
            title={
              isSelf
                ? "Self-deletion is blocked"
                : isAdmin
                ? "Administrators cannot delete other administrators"
                : "Delete user profile"
            }
            aria-disabled={cannotDelete}
          >
            <span className="material-symbols-outlined um-action-btn__icon" aria-hidden="true">delete</span>
            <span className="um-action-btn__label">Delete</span>
          </button>

        </div>
      </td>
    </tr>
  );
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

/**
 * Renders the page-number strip + prev/next arrows.
 * Kept separate so the layout logic is easy to follow.
 */
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="um-pagination" aria-label="Table pagination">
      {/* Prev arrow */}
      <button
        id="um-pagination-prev"
        type="button"
        className="um-pagination__arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
      </button>

      {/* Numbered page buttons */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          id={`um-pagination-page-${page}`}
          type="button"
          className={`um-pagination__page${page === currentPage ? " um-pagination__page--active" : ""}`}
          onClick={() => onPageChange(page)}
          aria-label={`Go to page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      {/* Next arrow */}
      <button
        id="um-pagination-next"
        type="button"
        className="um-pagination__arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </button>
    </nav>
  );
}

// ─── UserTable ────────────────────────────────────────────────────────────────

/**
 * UserTable — renders a clean striped data table with client-side pagination.
 * PAGE_SIZE rows are shown per page; a page strip appears in the footer once
 * the total exceeds PAGE_SIZE.
 * Stateless regarding data — all actions are lifted to UserManagement.
 */
export default function UserTable({ users, currentAdminUid, onEdit, onToggleRole, onDelete }) {
  const [prevUsers, setPrevUsers] = useState(users);
  const [currentPage, setCurrentPage] = useState(1);

  if (users !== prevUsers) {
    setPrevUsers(users);
    setCurrentPage(1);
  }

  if (users.length === 0) return <EmptyState />;

  const totalPages  = Math.ceil(users.length / PAGE_SIZE);
  const startIndex  = (currentPage - 1) * PAGE_SIZE;
  const pageUsers   = users.slice(startIndex, startIndex + PAGE_SIZE);

  // Range label: "1–5 of 12"
  const rangeStart  = startIndex + 1;
  const rangeEnd    = Math.min(startIndex + PAGE_SIZE, users.length);

  return (
    <div className="um-table-wrap">
      <div className="um-table-scroll">
        <table className="um-table" role="table" aria-label="Staff member directory">
          <thead className="um-table__head">
            <tr role="row">
              <th className="um-table__th um-table__th--name"  scope="col">Staff Member</th>
              <th className="um-table__th"                     scope="col">Email Address</th>
              <th className="um-table__th"                     scope="col">System Role</th>
              <th className="um-table__th"                     scope="col">Registered On</th>
              <th className="um-table__th um-table__th--right" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((user, index) => (
              <UserRow
                key={user.uid}
                user={user}
                currentAdminUid={currentAdminUid}
                onEdit={onEdit}
                onToggleRole={onToggleRole}
                onDelete={onDelete}
                /* Preserve visual stripe continuity relative to the page start */
                isEven={index % 2 === 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer: count + pagination ──────────────────── */}
      <div className="um-table__footer">
        <span className="um-table__count" aria-live="polite">
          {totalPages > 1
            ? `${rangeStart}–${rangeEnd} of ${users.length} members`
            : `${users.length} ${users.length === 1 ? "member" : "members"}`}
        </span>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
