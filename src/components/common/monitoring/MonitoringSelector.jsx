import { CATEGORIES, SUBCATEGORIES, SUBCATEGORY_META } from "../../../utils/monitoringConstants";

/**
 * MonitoringSelector — Handles steps 2 (Category Selection) and 3 (Subcategory Selection)
 * in the unified submissions flow for Ecological Monitoring.
 */
function MonitoringSelector({ mode, category, onSelectCategory, onSelectSubcategory, onBack }) {
  const activeCategoryMeta = CATEGORIES.find((c) => c.id === category);

  if (mode === "category") {
    return (
      <div className="mon-step">
        <div className="mon-breadcrumb">
          <button type="button" className="mon-breadcrumb__back" onClick={onBack} aria-label="Back to type selection">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
        <div className="mon-step-label">
          <span className="mon-step-label__num">2</span>
          <span className="mon-step-label__text">Choose a Monitoring Category</span>
        </div>
        <div className="mon-step-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="mon-step-card"
              id={`mon-cat-${cat.id}`}
              aria-label={`Select ${cat.label}`}
            >
              <div className="mon-step-card__icon-wrap">
                <span className="material-symbols-outlined">{cat.icon}</span>
              </div>
              <p className="mon-step-card__title">{cat.label}</p>
              <p className="mon-step-card__desc">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // mode === "subcategory"
  return (
    <div className="mon-step">
      <div className="mon-breadcrumb">
        <button type="button" className="mon-breadcrumb__back" onClick={onBack} aria-label="Back to categories">
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>
        <span className="mon-breadcrumb__sep">
          <span className="material-symbols-outlined">chevron_right</span>
        </span>
        <span className="mon-breadcrumb__chip">
          <span className="material-symbols-outlined">{activeCategoryMeta?.icon}</span>
          {activeCategoryMeta?.label}
        </span>
      </div>

      <div className="mon-step-label">
        <span className="mon-step-label__num">3</span>
        <span className="mon-step-label__text">Choose a Form Type</span>
      </div>

      <div className="mon-step-grid mon-step-grid--two">
        {SUBCATEGORIES[category]?.map((sub) => {
          const meta = SUBCATEGORY_META[sub];
          return (
            <button
              key={sub}
              type="button"
              onClick={() => onSelectSubcategory(sub)}
              className="mon-step-card"
              id={`mon-sub-${sub.replace(/\s+/g, "-")}`}
              aria-label={`Select ${sub}`}
            >
              <div className="mon-step-card__icon-wrap">
                <span className="material-symbols-outlined">{meta?.icon ?? "description"}</span>
              </div>
              <p className="mon-step-card__title">{sub}</p>
              <p className="mon-step-card__desc">{meta?.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MonitoringSelector;
