import { useState, useMemo, useCallback } from "react";
import { STATUS_GROUPS } from "../utils/incidentConstants";
import { parseLogDate, isDateInRange, sortIncidentsWithPriority } from "../utils/filterUtils";

/**
 * Headless filter and priority ranking hook for Incident Reports & Monitoring Logs.
 */
export function useLogFilters(items = [], options = {}) {
  const {
    mode = "incident", isAdmin = false, fixedCategory = null,
    stageId = null, allowedStatusOptions = null
  } = options;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(fixedCategory || "All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [selectedBarangay, setSelectedBarangay] = useState("All");
  const [selectedReporter, setSelectedReporter] = useState("All");
  const [datePreset, setDatePreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [prioritizeCritical, setPrioritizeCritical] = useState(mode === "incident" && stageId !== "completed-archive");


  const dynamicOptions = useMemo(() => {
    const cats = new Set(), subcats = new Set(), brgys = new Set(), reps = new Set();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
      if (item.subcategory) subcats.add(item.subcategory);
      if (item.barangay) brgys.add(item.barangay);
      else if (item.location) brgys.add(item.location);
      if (item.reporter?.name) reps.add(item.reporter.name);
    });
    return {
      categories: Array.from(cats).sort(),
      subcategories: Array.from(subcats).sort(),
      barangays: Array.from(brgys).sort(),
      reporters: Array.from(reps).sort()
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const statusSet = new Set(
      selectedStatuses.flatMap((l) => STATUS_GROUPS[l] || [l.toLowerCase()])
    );
    const severitySet = new Set(selectedSeverities.map((s) => s.toLowerCase()));

    const filtered = items.filter((item) => {
      if (q) {
        const itemText = mode === "incident"
          ? `${item.incidentType || ""} ${item.category || ""} ${item.location || ""} ${item.reporter?.name || ""} ${item.description || ""}`
          : `${item.category || ""} ${item.subcategory || ""} ${item.barangay || ""} ${item.reporter?.name || ""} ${item.speciesName || ""} ${item.waterBody || ""}`;
        if (!itemText.toLowerCase().includes(q)) return false;
      }

      if (statusSet.size > 0 && !statusSet.has(item.status?.toLowerCase())) return false;
      if (mode === "incident" && severitySet.size > 0 && !severitySet.has(item.severity?.toLowerCase())) return false;

      const activeCat = fixedCategory || selectedCategory;
      if (activeCat !== "All" && item.category !== activeCat) return false;
      if (selectedSubcategory !== "All" && item.subcategory !== selectedSubcategory) return false;
      if (selectedBarangay !== "All" && item.barangay !== selectedBarangay && item.location !== selectedBarangay) return false;
      if (isAdmin && selectedReporter !== "All" && item.reporter?.name !== selectedReporter) return false;

      return isDateInRange(parseLogDate(item.dateTime || item.createdAt), datePreset, customStartDate, customEndDate);
    });

    return mode === "incident"
      ? sortIncidentsWithPriority(filtered, prioritizeCritical, { stageId })
      : filtered;
  }, [
    items, searchQuery, selectedStatuses, selectedSeverities, fixedCategory,
    selectedCategory, selectedSubcategory, selectedBarangay, selectedReporter,
    datePreset, customStartDate, customEndDate, mode, isAdmin, prioritizeCritical, stageId
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    count += selectedStatuses.length;
    if (mode === "incident") count += selectedSeverities.length;
    if (!fixedCategory && selectedCategory !== "All") count++;
    if (selectedSubcategory !== "All") count++;
    if (selectedBarangay !== "All") count++;
    if (isAdmin && selectedReporter !== "All") count++;
    if (datePreset !== "all") count++;
    return count;
  }, [
    searchQuery, selectedStatuses, selectedSeverities, fixedCategory,
    selectedCategory, selectedSubcategory, selectedBarangay, selectedReporter,
    datePreset, mode, isAdmin
  ]);

  const toggleStatus = useCallback((status) => {
    setSelectedStatuses((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]);
  }, []);

  const toggleSeverity = useCallback((sev) => {
    setSelectedSeverities((prev) => prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedSeverities([]);
    if (!fixedCategory) setSelectedCategory("All");
    setSelectedSubcategory("All");
    setSelectedBarangay("All");
    setSelectedReporter("All");
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    if (mode === "incident") setPrioritizeCritical(stageId !== "completed-archive");
  }, [fixedCategory, mode, stageId]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (searchQuery.trim()) chips.push({ id: "q", label: `Search: "${searchQuery}"`, onRemove: () => setSearchQuery("") });
    selectedStatuses.forEach((s) => chips.push({ id: `st-${s}`, label: `Status: ${s}`, onRemove: () => toggleStatus(s) }));
    selectedSeverities.forEach((sev) => chips.push({ id: `sev-${sev}`, label: `Severity: ${sev}`, onRemove: () => toggleSeverity(sev) }));
    if (!fixedCategory && selectedCategory !== "All") chips.push({ id: "cat", label: `Category: ${selectedCategory}`, onRemove: () => setSelectedCategory("All") });
    if (selectedSubcategory !== "All") chips.push({ id: "subcat", label: `Sub: ${selectedSubcategory}`, onRemove: () => setSelectedSubcategory("All") });
    if (selectedBarangay !== "All") chips.push({ id: "brgy", label: `Location: ${selectedBarangay}`, onRemove: () => setSelectedBarangay("All") });
    if (isAdmin && selectedReporter !== "All") chips.push({ id: "rep", label: `Reporter: ${selectedReporter}`, onRemove: () => setSelectedReporter("All") });
    if (datePreset !== "all") {
      const lbl = datePreset === "today" ? "Date: Today" : datePreset === "7d" ? "Date: Last 7 Days" : datePreset === "30d" ? "Date: Last 30 Days" : `Date: ${customStartDate || "Start"} - ${customEndDate || "End"}`;
      chips.push({ id: "dt", label: lbl, onRemove: () => setDatePreset("all") });
    }
    return chips;
  }, [
    searchQuery, selectedStatuses, selectedSeverities, fixedCategory, selectedCategory,
    selectedSubcategory, selectedBarangay, selectedReporter, datePreset, customStartDate,
    customEndDate, isAdmin, toggleStatus, toggleSeverity
  ]);

  return {
    searchQuery, setSearchQuery, selectedStatuses, toggleStatus, selectedSeverities, toggleSeverity,
    selectedCategory, setSelectedCategory, selectedSubcategory, setSelectedSubcategory,
    selectedBarangay, setSelectedBarangay, selectedReporter, setSelectedReporter,
    datePreset, setDatePreset, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    isPanelOpen, setIsPanelOpen, dynamicOptions, filteredItems, activeFilterCount, activeChips,
    resetFilters, prioritizeCritical, setPrioritizeCritical, stageId, allowedStatusOptions
  };
}
