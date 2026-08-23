import { useState, useMemo, useEffect, useCallback } from "react";
import { exportToCSV, exportToPDF } from "../../utils/exportService";

const SUBCATEGORY_MAP = {
  BMS: [
    { label: "All BMS Subcategories", value: "all" },
    { label: "Avian Tracking Form", value: "Avian Tracking Form" },
    { label: "Wildlife Observations Form", value: "Wildlife Observations Form" }
  ],
  Water: [
    { label: "All Water Subcategories", value: "all" },
    { label: "Water Source Monitoring", value: "Local Water Source Monitoring Form" },
    { label: "Ecosystem Conservation", value: "Ecosystem Conservation Log" }
  ],
  Compliance: [
    { label: "All Compliance Subcategories", value: "all" },
    { label: "Plastic Bag Ban Inspection", value: "Plastic Bag Ban Inspection Form" },
    { label: "Waste Collection Tracking", value: "Waste Collection Tracking Form" }
  ],
  Incidents: [
    { label: "All Incident Categories", value: "all" },
    { label: "Forest Incidents", value: "Forest Incidents" },
    { label: "Wildlife Incidents", value: "Wildlife Incidents" },
    { label: "Water Resource Incidents", value: "Water Resource Incidents" },
    { label: "Waste Incidents", value: "Waste Incidents" },
    { label: "Compliance Incidents", value: "Compliance Incidents" },
    { label: "Ecosystem Protection", value: "Ecosystem Protection Incidents" }
  ]
};

const DATE_PRESETS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7days", label: "Last 7 Days" },
  { id: "30days", label: "Last 30 Days" },
  { id: "custom", label: "Custom Range" }
];

const STATUS_PRESETS = [
  { id: "all", label: "All Statuses" },
  { id: "completed", label: "Completed / Archived" },
  { id: "active", label: "Active / In-Progress" }
];

/**
 * Inner dialog component holding state lifecycle while modal is active.
 * @param {Object} props
 * @param {() => void} props.onClose
 * @param {string} [props.scope]
 * @param {Array<Object>} [props.data]
 * @param {Function} [props.onExport]
 */
function ExportModalDialog({
  onClose,
  scope = "Incidents",
  data = [],
  onExport = null
}) {
  const [format, setFormat] = useState("csv");
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [selectedGlobalCategory, setSelectedGlobalCategory] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isGlobalMonitoring = scope === "All Monitoring" || scope === "Monitoring Logs";
  const isIncidents = scope === "Incidents" || scope.toLowerCase().includes("incident");

  // Handle escape key listener
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Available subcategories list based on current scope
  const availableSubcategories = useMemo(() => {
    if (isGlobalMonitoring) {
      if (selectedGlobalCategory === "BMS") return SUBCATEGORY_MAP.BMS;
      if (selectedGlobalCategory === "Water") return SUBCATEGORY_MAP.Water;
      if (selectedGlobalCategory === "Compliance") return SUBCATEGORY_MAP.Compliance;
      return [{ label: "All Monitoring Subcategories", value: "all" }];
    }
    if (scope === "BMS") return SUBCATEGORY_MAP.BMS;
    if (scope === "Water") return SUBCATEGORY_MAP.Water;
    if (scope === "Compliance") return SUBCATEGORY_MAP.Compliance;
    if (isIncidents) return SUBCATEGORY_MAP.Incidents;
    return [{ label: "All Items", value: "all" }];
  }, [scope, isGlobalMonitoring, selectedGlobalCategory, isIncidents]);

  // Live filtered records calculation
  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.filter((item) => {
      // 1. Global Category Filter
      if (isGlobalMonitoring && selectedGlobalCategory !== "all") {
        if ((item.category || "").toLowerCase() !== selectedGlobalCategory.toLowerCase()) {
          return false;
        }
      }

      // 2. Subcategory / Incident Category Filter
      if (selectedSubcategory !== "all") {
        if (isIncidents) {
          const itemCat = (item.category || "").toLowerCase();
          const targetCat = selectedSubcategory.toLowerCase();
          if (itemCat !== targetCat && !itemCat.includes(targetCat.replace(" incidents", ""))) {
            return false;
          }
        } else {
          if (item.subcategory !== selectedSubcategory) {
            return false;
          }
        }
      }

      // 3. Status Filter
      if (statusFilter !== "all") {
        const s = (item.status || "").toLowerCase();
        if (statusFilter === "completed" && s !== "completed" && s !== "verified") {
          return false;
        }
        if (statusFilter === "active" && (s === "completed" || s === "denied")) {
          return false;
        }
      }

      // 4. Date Range Filter
      const itemTimestamp = item.createdAt?.seconds
        ? item.createdAt.seconds * 1000
        : item.createdAt
        ? new Date(item.createdAt).getTime()
        : null;

      if (!itemTimestamp || isNaN(itemTimestamp)) return true;

      const now = new Date();

      if (dateRange === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return itemTimestamp >= startOfToday;
      }
      if (dateRange === "7days") {
        const cutoff7 = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return itemTimestamp >= cutoff7;
      }
      if (dateRange === "30days") {
        const cutoff30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        return itemTimestamp >= cutoff30;
      }
      if (dateRange === "custom") {
        if (startDate) {
          const startMs = new Date(startDate).getTime();
          if (itemTimestamp < startMs) return false;
        }
        if (endDate) {
          const endMs = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1; // End of selected day
          if (itemTimestamp > endMs) return false;
        }
      }

      return true;
    });
  }, [
    data,
    isGlobalMonitoring,
    selectedGlobalCategory,
    selectedSubcategory,
    isIncidents,
    statusFilter,
    dateRange,
    startDate,
    endDate
  ]);

  const handleDownload = () => {
    if (filteredData.length === 0) return;

    const dateStamp = new Date().toISOString().split("T")[0];
    const safeScope = scope.replace(/\s+/g, "_");
    const subScope = selectedSubcategory !== "all" ? `_${selectedSubcategory.replace(/\s+/g, "_")}` : "";
    const filename = `WMIRS_${safeScope}${subScope}_${dateStamp}`;
    const docTitle = `WMIRS ${scope} Export Report`;

    if (onExport) {
      onExport({
        format,
        includeAnalytics,
        dateRange,
        category: selectedGlobalCategory,
        subcategory: selectedSubcategory,
        statusFilter,
        filteredData
      });
      onClose();
      return;
    }

    if (format === "csv") {
      exportToCSV(filteredData, scope, filename, { includeAnalytics });
    } else {
      exportToPDF(filteredData, scope, filename, docTitle, { includeAnalytics });
    }

    onClose();
  };

  return (
    <div
      className="export-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        className="export-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Band */}
        <div className="export-modal-header">
          <div className="export-modal-header__info">
            <div className="export-modal-header__eyebrow">
              <span className="material-symbols-outlined export-modal-header__icon">file_download</span>
              <span>Administrative Intelligence</span>
            </div>
            <h2 id="export-modal-title" className="export-modal-header__title">
              Export {scope}
            </h2>
            <p className="export-modal-header__subtitle">
              Download field audit records, graphs, and domain metrics in structured format.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="export-modal-close-btn"
            aria-label="Close export dialog"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="export-modal-body">
          {/* 1. Choose File Format Cards */}
          <div className="export-section">
            <label className="export-section__label">1. Choose File Format</label>
            <div className="export-format-grid">
              <button
                type="button"
                className={`export-format-card ${format === "csv" ? "export-format-card--active" : ""}`}
                onClick={() => setFormat("csv")}
              >
                <div className="export-format-card__icon-wrap export-format-card__icon-wrap--csv">
                  <span className="material-symbols-outlined">table_view</span>
                </div>
                <div className="export-format-card__content">
                  <span className="export-format-card__title">CSV Spreadsheet</span>
                  <span className="export-format-card__desc">Complete raw data with specialized domain fields & time-series summaries</span>
                </div>
              </button>

              <button
                type="button"
                className={`export-format-card ${format === "pdf" ? "export-format-card--active" : ""}`}
                onClick={() => setFormat("pdf")}
              >
                <div className="export-format-card__icon-wrap export-format-card__icon-wrap--pdf">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                </div>
                <div className="export-format-card__content">
                  <span className="export-format-card__title">PDF Document</span>
                  <span className="export-format-card__desc">Executive dossier with embedded vector trend graphs & audit table</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Visual Analytics Graphs Toggle */}
          <div className="export-toggle-card">
            <label className="export-toggle-label">
              <input
                type="checkbox"
                checked={includeAnalytics}
                onChange={(e) => setIncludeAnalytics(e.target.checked)}
                className="export-toggle-checkbox"
              />
              <div className="export-toggle-content">
                <div className="export-toggle-title">
                  <span className="material-symbols-outlined export-toggle-icon">auto_graph</span>
                  <span>Include Visual Analytics Graphs & Trend Summaries</span>
                </div>
                <p className="export-toggle-desc">
                  {format === "pdf"
                    ? "Generates Executive KPI cards, Temporal Activity Line Graphs, and Domain Distribution Charts on Page 1."
                    : "Pre-pends an aggregated Time-Series Trend & Classification summary before detailed record rows."}
                </p>
              </div>
            </label>
          </div>

          {/* 3. Global Monitoring Category (if applicable) */}
          {isGlobalMonitoring && (
            <div className="export-section">
              <label className="export-section__label">2. Category Scope</label>
              <div className="export-chip-group">
                {[
                  { id: "all", label: "All Monitoring" },
                  { id: "BMS", label: "BMS Flora & Fauna" },
                  { id: "Water", label: "Water Resources" },
                  { id: "Compliance", label: "Compliance & Waste" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`export-chip ${selectedGlobalCategory === cat.id ? "export-chip--active" : ""}`}
                    onClick={() => {
                      setSelectedGlobalCategory(cat.id);
                      setSelectedSubcategory("all");
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Subcategory Filter */}
          <div className="export-section">
            <label className="export-section__label">
              {isIncidents ? "2. Incident Classification" : isGlobalMonitoring ? "3. Specific Subcategory" : "2. Subcategory Filter"}
            </label>
            <div className="export-select-wrap">
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="export-select"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Workflow Status Filter */}
          <div className="export-section">
            <label className="export-section__label">
              {isGlobalMonitoring ? "4. Status Filter" : "3. Status Filter"}
            </label>
            <div className="export-chip-group">
              {STATUS_PRESETS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`export-chip ${statusFilter === st.id ? "export-chip--active" : ""}`}
                  onClick={() => setStatusFilter(st.id)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Date Range Selector */}
          <div className="export-section">
            <label className="export-section__label">
              {isGlobalMonitoring ? "5. Date Range" : "4. Date Range"}
            </label>
            <div className="export-chip-group">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`export-chip ${dateRange === preset.id ? "export-chip--active" : ""}`}
                  onClick={() => setDateRange(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {dateRange === "custom" && (
              <div className="export-custom-date-grid">
                <div className="export-input-wrap">
                  <span className="export-input-label">Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="export-date-input"
                  />
                </div>
                <div className="export-input-wrap">
                  <span className="export-input-label">End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="export-date-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Live Match Counter and Action Buttons */}
        <div className="export-modal-footer">
          <div className="export-counter-badge">
            <span className="material-symbols-outlined export-counter-badge__icon">analytics</span>
            <span className="export-counter-badge__text">
              <strong>{filteredData.length}</strong> {filteredData.length === 1 ? "record" : "records"} ready to export
            </span>
          </div>

          <div className="export-modal-footer__actions">
            <button
              type="button"
              onClick={onClose}
              className="export-btn export-btn--secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={filteredData.length === 0}
              className="export-btn export-btn--primary"
            >
              <span className="material-symbols-outlined">download</span>
              <span>Download {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modern, responsive MongoDB-styled Export Modal for WMIRS Admin reports.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.scope]
 * @param {Array<Object>} [props.data]
 * @param {Function} [props.onExport]
 */
export default function ExportModal({
  isOpen,
  onClose,
  scope = "Incidents",
  data = [],
  onExport = null
}) {
  if (!isOpen) return null;

  return (
    <ExportModalDialog
      onClose={onClose}
      scope={scope}
      data={data}
      onExport={onExport}
    />
  );
}
