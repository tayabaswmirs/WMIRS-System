export default function KpiCard({ variant, icon, value, label, sub }) {
  return (
    <div className={`dash-kpi-card dash-kpi-card--${variant}`}>
      <div className="dash-kpi-card__icon-wrap">
        <span className="material-symbols-outlined dash-kpi-card__icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="dash-kpi-card__body">
        <span className="dash-kpi-card__value">{value}</span>
        <span className="dash-kpi-card__label">{label}</span>
        {sub ? <span className="dash-kpi-card__sub">{sub}</span> : null}
      </div>
    </div>
  );
}
