export default function ChartCard({ icon, title, subtitle, extraHeader, variant, accentColor, children }) {
  const variantClass = variant ? `dash-chart-card--${variant}` : "";
  const cardStyle = accentColor ? { borderTop: `4px solid ${accentColor}` } : {};

  return (
    <div className={`dash-chart-card ${variantClass}`} style={cardStyle}>
      <div className="dash-chart-card__header" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <span className="material-symbols-outlined dash-chart-card__header-icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <div className="dash-chart-card__title">{title}</div>
            {subtitle ? <div className="dash-chart-card__subtitle">{subtitle}</div> : null}
          </div>
        </div>
        {extraHeader ? <div>{extraHeader}</div> : null}
      </div>
      <div className="dash-chart-card__body">
        {children}
      </div>
    </div>
  );
}
