/**
 * FilterSelect — MongoDB documentation-styled dropdown select component with custom icons.
 */
export default function FilterSelect({
  label,
  value,
  onChange,
  options = [],
  defaultOptionLabel = "All",
  icon = null
}) {
  return (
    <div className="wmirs-select-wrap">
      {label && <label className="wmirs-filter-label">{label}</label>}
      <div className="wmirs-select-inner">
        {icon && (
          <span className="material-symbols-outlined wmirs-select-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="wmirs-filter-select"
          style={{ paddingLeft: icon ? "38px" : "14px" }}
          aria-label={label}
        >
          <option value="All">{defaultOptionLabel}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined wmirs-select-chevron" aria-hidden="true">
          expand_more
        </span>
      </div>
    </div>
  );
}
