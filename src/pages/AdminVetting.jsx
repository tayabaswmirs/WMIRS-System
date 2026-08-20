import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import RoleEditModal from "../components/common/RoleEditModal";
import ConfirmModal from "../components/common/ConfirmModal";
import { getPendingUsers, setUserRoleAdmin, deleteUserAdmin } from "../firebase/services/userService";

const buildRejectConfirm = (user) => ({
  variant:      "danger",
  title:        "Reject Registration",
  message:      `This will permanently delete the authentication record and profile document for ${user.name || "this user"}. They will need to register again if this is a mistake.`,
  confirmLabel: "Reject & Delete",
});

export default function AdminVetting() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setErrorMsg("");
      const list = await getPendingUsers();
      setUsers(list);
    } catch (err) {
      console.error("Error loading pending users:", err);
      setErrorMsg("Failed to load pending registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getPendingUsers()
      .then((list) => {
        if (active) {
          setUsers(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Error loading pending users:", err);
          setErrorMsg("Failed to load pending registrations.");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const handleApproveClick = (user) => {
    setErrorMsg("");
    setSuccessMsg("");
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (updates) => {
    try {
      setIsRoleSaving(true);
      setErrorMsg("");
      setSuccessMsg("");
      await setUserRoleAdmin(selectedUser.uid, updates.role, updates.staffScope);
      setSuccessMsg(`Approved ${selectedUser.name || "user"} as ${updates.role}.`);
      setRoleModalOpen(false);
      await fetchUsers();
    } catch (err) {
      console.error("Approve error:", err);
      setErrorMsg("Failed to approve user. Please try again.");
    } finally {
      setIsRoleSaving(false);
    }
  };

  const handleRejectClick = (user) => {
    setErrorMsg("");
    setSuccessMsg("");
    setConfirmConfig(buildRejectConfirm(user));
    setPendingAction(() => async () => {
      await deleteUserAdmin(user.uid);
      setSuccessMsg(`Registration for ${user.name || "user"} has been rejected and deleted.`);
      await fetchUsers();
    });
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    try {
      setConfirmLoading(true);
      setErrorMsg("");
      await pendingAction();
    } catch (err) {
      console.error("Confirm action error:", err);
      setErrorMsg("The operation failed. Please try again.");
    } finally {
      setConfirmLoading(false);
      setConfirmConfig(null);
      setPendingAction(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="um-page">
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Administration Portal</span>
            <h1 className="inc-hero__title">User Vetting & Approval</h1>
            <p className="inc-hero__subtitle">
              Review and approve pending registrations before they gain access to the system.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="um-alert um-alert--error" role="alert">
            <span className="material-symbols-outlined um-alert__icon" aria-hidden="true">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="um-alert um-alert--success" role="status">
            <span className="material-symbols-outlined um-alert__icon" aria-hidden="true">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="um-loading-state" role="status" aria-live="polite">
            <div className="um-loading-state__spinner" aria-hidden="true" />
            <p className="um-loading-state__label">Retrieving pending registrations…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="um-empty-state" role="status">
            <div className="um-empty-state__icon-wrap">
              <span className="material-symbols-outlined um-empty-state__icon" aria-hidden="true">
                how_to_reg
              </span>
            </div>
            <h3 className="um-empty-state__title">No Pending Registrations</h3>
            <p className="um-empty-state__desc">There are currently no users waiting for approval.</p>
          </div>
        ) : (
          <div className="um-table-wrap">
            <div className="um-table-scroll">
              <table className="um-table" role="table" aria-label="Pending user directory">
                <thead className="um-table__head">
                  <tr role="row">
                    <th className="um-table__th um-table__th--name" scope="col">Staff Member</th>
                    <th className="um-table__th" scope="col">Email Address</th>
                    <th className="um-table__th" scope="col">System Role</th>
                    <th className="um-table__th" scope="col">Date Registered</th>
                    <th className="um-table__th um-table__th--right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.uid} className={`um-table__row${index % 2 === 1 ? " um-table__row--even" : ""}`} role="row">
                      <td className="um-table__cell um-table__cell--name">
                        <div className="um-table__name-cell">
                          <div className="um-table__avatar um-table__avatar--staff" aria-hidden="true">
                            {(user.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div className="um-table__name-text">
                            {user.name || "Unknown"}
                          </div>
                        </div>
                      </td>
                      <td className="um-table__cell um-table__cell--email">
                        <span className="um-table__email">{user.email || "No Email"}</span>
                      </td>
                      <td className="um-table__cell um-table__cell--role">
                        <span className="um-role-badge" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--c-red-500)" }}>
                          <span className="um-role-badge__dot" style={{ backgroundColor: "var(--c-red-500)" }} aria-hidden="true" />
                          Pending Approval
                        </span>
                      </td>
                      <td className="um-table__cell um-table__cell--date">
                        {user.createdAt ? new Date(user.createdAt.toMillis ? user.createdAt.toMillis() : user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Unknown"}
                      </td>
                      <td className="um-table__cell um-table__cell--actions">
                        <div className="um-table__actions">
                          <button 
                            className="um-action-btn um-action-btn--promote" 
                            onClick={() => handleApproveClick(user)}
                            title="Approve user"
                          >
                            <span className="material-symbols-outlined um-action-btn__icon" aria-hidden="true">check_circle</span>
                            <span className="um-action-btn__label">Approve</span>
                          </button>
                          <button 
                            className="um-action-btn um-action-btn--delete" 
                            onClick={() => handleRejectClick(user)}
                            title="Reject user"
                          >
                            <span className="material-symbols-outlined um-action-btn__icon" aria-hidden="true">cancel</span>
                            <span className="um-action-btn__label">Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <RoleEditModal
          key={`role-${selectedUser?.uid || "none"}`}
          isOpen={roleModalOpen}
          user={selectedUser}
          onClose={() => setRoleModalOpen(false)}
          onSave={handleSaveRole}
          isSaving={isRoleSaving}
        />

        {confirmConfig && (
          <ConfirmModal
            isOpen={Boolean(confirmConfig)}
            variant={confirmConfig.variant}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmLabel={confirmConfig.confirmLabel}
            onConfirm={handleConfirm}
            onCancel={() => setConfirmConfig(null)}
            isLoading={confirmLoading}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
