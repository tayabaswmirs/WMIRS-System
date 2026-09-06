import PasswordInput from "../PasswordInput";

export default function ProfileAccountForm({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  address,
  setAddress,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  isSaving,
  disabled,
}) {
  return (
    <div className="prof-card">
      <h2 className="prof-card__title" style={{ margin: 0 }}>Account Information</h2>
      <form onSubmit={onSubmit} className="um-edit-form">
        <div className="prof-grid">
          <div className="um-form-group">
            <label htmlFor="prof-name" className="um-form-label">Full Name</label>
            <input
              id="prof-name"
              type="text"
              required
              disabled={disabled}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="um-form-input"
              placeholder="Juan dela Cruz"
            />
          </div>

          <div className="um-form-group">
            <label htmlFor="prof-email" className="um-form-label">Email Address</label>
            <input
              id="prof-email"
              type="email"
              required
              disabled={disabled}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="um-form-input"
              placeholder="juan@email.com"
            />
          </div>

          <div className="um-form-group">
            <label htmlFor="prof-phone" className="um-form-label">Contact Number</label>
            <input
              id="prof-phone"
              type="tel"
              disabled={disabled}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="um-form-input"
              placeholder="e.g. 09123456789"
            />
          </div>

          <div className="um-form-group">
            <label htmlFor="prof-address" className="um-form-label">Address / Barangay</label>
            <input
              id="prof-address"
              type="text"
              disabled={disabled}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="um-form-input"
              placeholder="e.g. Brgy. San Diego, Tayabas City"
            />
          </div>
        </div>

        <div className="prof-card__title" style={{ marginTop: "var(--sp-md)", borderBottom: "1px solid var(--c-hairline-soft)" }}>
          Change Password
        </div>
        <p className="um-edit-desc" style={{ textAlign: "left", fontSize: "12px", margin: "0" }}>
          Leave blank to keep your current password.
        </p>

        <div className="prof-grid">
          <div className="um-form-group">
            <label htmlFor="prof-pass" className="um-form-label">New Password</label>
            <PasswordInput
              id="prof-pass"
              disabled={disabled}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="um-form-input"
              placeholder="•••••••• (6+ characters)"
            />
          </div>

          <div className="um-form-group">
            <label htmlFor="prof-confirm" className="um-form-label">Confirm New Password</label>
            <PasswordInput
              id="prof-confirm"
              disabled={disabled}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="um-form-input"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={disabled}
            className="um-btn-confirm um-btn-confirm--primary"
            style={{ borderRadius: "var(--r-full)", height: "40px" }}
          >
            {isSaving ? (
              <>
                <span className="um-spinner" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">save</span>
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
