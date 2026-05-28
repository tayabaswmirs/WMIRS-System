import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import UserTable from "../components/common/UserTable";
import UserEditModal from "../components/common/UserEditModal";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  getAllUsers,
  updateUserAdmin,
  setUserRoleAdmin,
  deleteUserAdmin,
} from "../firebase/services/userService";

// ─── Confirmation dialog presets ──────────────────────────────────────────────

const buildRoleConfirm = (user) => ({
  variant:      "warning",
  title:        user.role === "admin" ? "Revoke Admin Privileges" : "Grant Admin Privileges",
  message:      user.role === "admin"
    ? `This will demote ${user.name || "this user"} from Administrator to ENRO Staff. They will immediately lose access to admin-only sections.`
    : `This will promote ${user.name || "this user"} to Administrator. They will gain full access to all admin controls.`,
  confirmLabel: user.role === "admin" ? "Demote User" : "Promote User",
});

const buildDeleteConfirm = (user) => ({
  variant:      "danger",
  title:        "Permanently Delete User",
  message:      `This will permanently delete the authentication record and profile document for ${user.name || "this user"}. Submissions and actions will remain in the system. This action cannot be undone.`,
  confirmLabel: "Delete Permanently",
});

// ─── Page Component ───────────────────────────────────────────────────────────

export default function UserManagement() {
  const { currentUser } = useAuth();

  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [isSaving,      setIsSaving]      = useState(false);

  // Confirm modal — single shared dialog driven by a config object
  const [confirmConfig,  setConfirmConfig]  = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  // pendingAction holds the async op to run when the user confirms
  const [pendingAction,  setPendingAction]  = useState(null);

  // ── Data fetching ─────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setErrorMsg("");
      const list = await getAllUsers();
      setUsers(list);
    } catch (err) {
      console.error("Error loading users:", err);
      setErrorMsg("Failed to load the staff directory. Please check your authorization.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAllUsers()
      .then((list)  => { if (active) { setUsers(list); setLoading(false); } })
      .catch((err)  => {
        if (active) {
          console.error("Error loading users:", err);
          setErrorMsg("Failed to load the staff directory. Please check your authorization.");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  // ── Edit handler ──────────────────────────────────────────────
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSaveUser = async (updates) => {
    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");
      await updateUserAdmin(selectedUser.uid, updates);
      setSuccessMsg(`Credentials updated for ${updates.name || selectedUser.name}.`);
      setEditModalOpen(false);
      await fetchUsers();
    } catch (err) {
      console.error("Save credentials error:", err);
      setErrorMsg("Failed to update user credentials. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Role toggle — opens confirm dialog ────────────────────────
  const handleToggleRole = (user) => {
    setErrorMsg("");
    setSuccessMsg("");
    setConfirmConfig(buildRoleConfirm(user));
    setPendingAction(() => async () => {
      const newRole = user.role === "admin" ? "user" : "admin";
      await setUserRoleAdmin(user.uid, newRole);
      const verb = user.role === "admin" ? "demoted" : "promoted";
      setSuccessMsg(`Successfully ${verb} ${user.name || "user"}.`);
      await fetchUsers();
    });
  };

  // ── Delete — opens confirm dialog ─────────────────────────────
  const handleDeleteUser = (user) => {
    setErrorMsg("");
    setSuccessMsg("");
    setConfirmConfig(buildDeleteConfirm(user));
    setPendingAction(() => async () => {
      await deleteUserAdmin(user.uid);
      setSuccessMsg(`User profile for ${user.name || "user"} has been permanently deleted.`);
      await fetchUsers();
    });
  };

  // ── Confirm: user pressed confirm button ──────────────────────
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

  const handleCancelConfirm = () => {
    setConfirmConfig(null);
    setPendingAction(null);
  };

  // ── Filtered users ────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q    = searchTerm.toLowerCase();
    const name = (u.name  || "").toLowerCase();
    const mail = (u.email || "").toLowerCase();
    return name.includes(q) || mail.includes(q);
  });

  // ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout pageTitle="User Management">
      <div className="um-page">

        {/* ── Plain white page header ─────────────────────────── */}
        <div className="um-page-header">
          <div className="um-page-header__text">
            <span className="um-page-header__eyebrow">Administration Portal</span>
            <h1 className="um-page-header__title">Staff &amp; Auth Management</h1>
          </div>

          <div className="um-search-wrap">
            <span
              className="material-symbols-outlined um-search-wrap__icon"
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="um-search-input"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email…"
              className="um-search-input"
              aria-label="Search staff members by name or email"
            />
          </div>
        </div>

        {/* ── Inline Alert Banners ────────────────────────────── */}
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

        {/* ── Content: Spinner or Table ───────────────────────── */}
        {loading ? (
          <div className="um-loading-state" role="status" aria-live="polite">
            <div className="um-loading-state__spinner" aria-hidden="true" />
            <p className="um-loading-state__label">Retrieving staff directory…</p>
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            currentAdminUid={currentUser?.uid}
            onEdit={handleEditClick}
            onToggleRole={handleToggleRole}
            onDelete={handleDeleteUser}
          />
        )}

        {/* ── Edit Credentials Modal ──────────────────────────── */}
        <UserEditModal
          key={selectedUser?.uid || "none"}
          isOpen={editModalOpen}
          user={selectedUser}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveUser}
          isSaving={isSaving}
        />

        {/* ── Destructive Action Confirmation Modal ───────────── */}
        {confirmConfig && (
          <ConfirmModal
            isOpen={Boolean(confirmConfig)}
            variant={confirmConfig.variant}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmLabel={confirmConfig.confirmLabel}
            onConfirm={handleConfirm}
            onCancel={handleCancelConfirm}
            isLoading={confirmLoading}
          />
        )}

      </div>
    </DashboardLayout>
  );
}
