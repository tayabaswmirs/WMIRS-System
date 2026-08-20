import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatPill from "../components/common/StatPill";
import BmsAnalyticsView from "../components/common/analytics/BmsAnalyticsView";
import WaterAnalyticsView from "../components/common/analytics/WaterAnalyticsView";
import ComplianceAnalyticsView from "../components/common/analytics/ComplianceAnalyticsView";
import { subscribeToCategoryMonitoring } from "../firebase/services/monitoringService";
import "../styles/dashboard.css";

const CATEGORY_META = {
  BMS: {
    title: "Biodiversity Monitoring (BMS) Analytics",
    eyebrow: "Flora & Fauna Intelligence",
    subtitle: "Taxonomic abundance, census velocity, and species population tracking.",
    icon: "forest",
    color: "#00b545"
  },
  Water: {
    title: "Water Resources Analytics",
    eyebrow: "Hydrological & Ecosystem Intelligence",
    subtitle: "Field-kit water quality parameters, watershed clarity, and pollution alerts.",
    icon: "water",
    color: "#3d8eff"
  },
  Compliance: {
    title: "Environmental Compliance Analytics",
    eyebrow: "Regulatory & Logistics Auditing",
    subtitle: "Solid waste management volume, commercial inspection compliance, and enforcement tickets.",
    icon: "verified_user",
    color: "#fa6e39"
  }
};

export default function AdminMonitoringCategoryAnalytics({ category = "BMS" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const meta = CATEGORY_META[category] || CATEGORY_META.BMS;

  useEffect(() => {
    const unsubscribe = subscribeToCategoryMonitoring(category, (data) => {
      setItems(data);
      setLoading(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [category]);

  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    items.forEach((item) => {
      const s = item.status?.toLowerCase();
      if (s === "completed") completed++;
      else if (s === "resolved" || s === "verified" || s === "pending completion") inProgress++;
    });
    return { completed, inProgress, total: items.length };
  }, [items]);

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* Hero Header */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">{meta.eyebrow}</span>
            <h1 className="inc-hero__title">{meta.title}</h1>
            <p className="inc-hero__subtitle">{meta.subtitle}</p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="task_alt" label="Completed" count={stats.completed} color="#00ed64" />
            <StatPill icon="pending_actions" label="Pending" count={stats.inProgress} color="#00a35c" />
            <StatPill icon="fact_check" label="Total Logs" count={stats.total} color={meta.color} />
          </div>
        </div>

        {loading ? (
          <p className="loading-text" style={{ padding: "64px", textAlign: "center", color: "var(--c-steel)" }}>
            Loading {category} analytics...
          </p>
        ) : (
          <>
            {category === "BMS" && <BmsAnalyticsView items={items} />}
            {category === "Water" && <WaterAnalyticsView items={items} />}
            {category === "Compliance" && <ComplianceAnalyticsView items={items} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
