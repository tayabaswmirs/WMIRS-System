export default function ProfileDangerZone({ onDeleteClick, isDeleting, disabled }) {
  return (
    <div className="prof-card prof-danger-zone">
      <h2 className="prof-danger-zone__title">
        <span className="material-symbols-outlined" aria-hidden="true">warning</span>
        Danger Zone
      </h2>
      <div className="prof-danger-zone__desc">
        Permanently delete your profile document and authentication account from the WMIRS Monitoring System.
        All your submitted items and historical actions will remain preserved within the system logs for record integrity.
        <strong> This operation cannot be reversed.</strong>
      </div>

      <button
        onClick={onDeleteClick}
        disabled={disabled}
        type="button"
        className="um-btn-confirm um-btn-confirm--danger prof-danger-zone__action"
      >
        {isDeleting ? (
          <>
            <span className="um-spinner" aria-hidden="true" />
            Deleting account...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">delete_forever</span>
            Delete My Account
          </>
        )}
      </button>
    </div>
  );
}
