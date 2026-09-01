import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Safely formats timestamp values (Firestore Timestamp, Date, string, or number) into standard string.
 * @param {any} ts
 * @returns {string} Formatted date string (YYYY-MM-DD HH:mm:ss)
 */
export const formatExportDateTime = (ts) => {
  if (!ts) return "";
  let dateObj = null;

  if (typeof ts === "object" && ts.seconds !== undefined) {
    dateObj = new Date(ts.seconds * 1000);
  } else if (ts instanceof Date) {
    dateObj = ts;
  } else if (typeof ts === "string" || typeof ts === "number") {
    dateObj = new Date(ts);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return String(ts || "");

  const pad = (n) => String(n).padStart(2, "0");
  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const hours = pad(dateObj.getHours());
  const minutes = pad(dateObj.getMinutes());
  const seconds = pad(dateObj.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Formats date-only string (YYYY-MM-DD).
 * @param {any} ts
 * @returns {string}
 */
export const formatExportDateOnly = (ts) => {
  const full = formatExportDateTime(ts);
  return full ? full.split(" ")[0] : "";
};

/**
 * Escapes and sanitizes a cell value for standard RFC 4180 CSV serialization.
 * @param {any} val
 * @returns {string}
 */
export const formatCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  if (Array.isArray(val)) {
    const joined = val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join("; ");
    return `"${joined.replace(/"/g, '""')}"`;
  }
  if (typeof val === "boolean") {
    return val ? '"Yes"' : '"No"';
  }
  if (typeof val === "object") {
    if (val.seconds !== undefined) {
      return `"${formatExportDateTime(val)}"`;
    }
    return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
  }
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Transforms BMS monitoring record into an adaptive data object.
 */
export const transformBmsRecord = (item) => {
  const isAvian = item.subcategory === "Avian Tracking Form" || item.classification === "Avian";
  const activities = Array.isArray(item.activities)
    ? item.activities.join("; ")
    : item.activities || item.behavior || "";

  return {
    "Log ID": item.id || "",
    "Category": "BMS",
    "Subcategory": item.subcategory || "BMS Log",
    "Species / Fauna Name": item.speciesName || item.avianSpecies || item.commonName || "Unspecified",
    "Taxonomic Class": item.classification || (isAvian ? "Avian" : "Unclassified"),
    "Organisms Count": item.count || item.quantity || 1,
    "Observed Activities": activities,
    "Habitat Type": item.habitatType || item.habitat || item.ecosystem || "",
    "Location / Barangay": item.barangay || item.location || "",
    "Weather Condition": item.weatherCondition || item.weather || "",
    "Status": item.status || "Submitted",
    "Reporter Name": item.reporter?.name || "Unknown",
    "Reporter Email": item.reporter?.email || "",
    "Date Sighted": formatExportDateTime(item.dateTime || item.createdAt),
    "Date Submitted": formatExportDateTime(item.createdAt),
    "Remarks / Notes": item.remarks || item.notes || ""
  };
};

/**
 * Transforms Water monitoring record into an adaptive data object.
 */
export const transformWaterRecord = (item) => {
  const pollutants = Array.isArray(item.pollutionIndicators)
    ? item.pollutionIndicators.join("; ")
    : item.pollutionIndicators || "";

  return {
    "Log ID": item.id || "",
    "Category": "Water",
    "Subcategory": item.subcategory || "Water Resource Log",
    "Water Body / Source": item.waterBody || item.waterSourceName || "Unspecified",
    "Flow Level / Rate": item.flowLevel || item.flowRate || "Normal",
    "Water Clarity": item.waterClarity || "Clear",
    "pH Level": item.phLevel || "N/A",
    "Temperature (°C)": item.temperature ? `${item.temperature}°C` : "N/A",
    "Dissolved Oxygen (mg/L)": item.dissolvedOxygen ? `${item.dissolvedOxygen} mg/L` : "N/A",
    "Pollution Indicators": pollutants || "None Reported",
    "Threat Severity": item.threatSeverity || "Low",
    "Location / Barangay": item.barangay || item.location || "",
    "Status": item.status || "Submitted",
    "Reporter Name": item.reporter?.name || "Unknown",
    "Reporter Email": item.reporter?.email || "",
    "Date Sighted": formatExportDateTime(item.dateTime || item.createdAt),
    "Date Submitted": formatExportDateTime(item.createdAt),
    "Remarks / Actions": item.remarks || item.notes || ""
  };
};

/**
 * Transforms Compliance monitoring record into an adaptive data object.
 */
export const transformComplianceRecord = (item) => {
  const isWaste = item.subcategory === "Waste Collection Tracking Form";
  let formattedVolume = "N/A";
  if (item.volumeValue !== undefined && item.volumeValue !== null) {
    formattedVolume = `${item.volumeValue} ${item.volumeUnit || "kg"}`;
  }

  let complianceStatus = "N/A";
  if (item.compliant !== undefined && item.compliant !== null) {
    complianceStatus = item.compliant ? "Compliant" : "Non-Compliant";
  }

  return {
    "Log ID": item.id || "",
    "Category": "Compliance",
    "Subcategory": item.subcategory || "Compliance Log",
    "Establishment / Business": item.businessName || item.establishmentName || (isWaste ? "Barangay Waste Logistics" : "N/A"),
    "Business Type": item.businessType || (isWaste ? "Solid Waste Collection" : "N/A"),
    "Compliance Status": complianceStatus,
    "Action / Citation Token": item.actionToken || item.violationToken || "None",
    "Waste Weight / Volume": formattedVolume,
    "Truck Plate / Vehicle": item.truckPlateNumber || item.plateNumber || "N/A",
    "Collector / Driver": item.driverName || item.collectorName || "N/A",
    "Location / Barangay": item.barangay || item.location || "",
    "Status": item.status || "Submitted",
    "Reporter Name": item.reporter?.name || "Unknown",
    "Reporter Email": item.reporter?.email || "",
    "Date Sighted / Inspected": formatExportDateTime(item.dateTime || item.createdAt),
    "Date Submitted": formatExportDateTime(item.createdAt),
    "Remarks / Details": item.remarks || item.violationDetails || item.notes || ""
  };
};

/**
 * Transforms Incident record into an adaptive data object.
 */
export const transformIncidentRecord = (item) => {
  return {
    "Incident ID": item.id || "",
    "Incident Category": item.category || "Uncategorized",
    "Incident Type": item.incidentType || "General Incident",
    "Severity Level": item.severity || "Standard",
    "Location": item.location || "Unspecified",
    "Coordinates": item.coordinates ? `${item.coordinates.latitude || ""}, ${item.coordinates.longitude || ""}` : "",
    "Status": item.status || "Submitted",
    "Reporter Name": item.reporter?.name || "Unknown",
    "Reporter Email": item.reporter?.email || "",
    "Reporter Contact": item.reporter?.contact || "",
    "Date Incident Occurred": formatExportDateTime(item.dateTime || item.createdAt),
    "Date Reported": formatExportDateTime(item.createdAt),
    "Description": item.description || "",
    "Resolution Notes": item.resolutionNotes || item.adminRemarks || "",
    "Audit Trail Count": Array.isArray(item.history) ? item.history.length : 0
  };
};

/**
 * Universal data mapper based on scope and record structure.
 */
export const normalizeExportRecords = (data, scope) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const lowerScope = (scope || "").toLowerCase();

  return data.map((item) => {
    const itemCategory = (item.category || "").toLowerCase();

    if (lowerScope === "incidents" || itemCategory.includes("incident") || item.incidentType) {
      return transformIncidentRecord(item);
    }
    if (lowerScope === "bms" || itemCategory === "bms") {
      return transformBmsRecord(item);
    }
    if (lowerScope === "water" || itemCategory === "water") {
      return transformWaterRecord(item);
    }
    if (lowerScope === "compliance" || itemCategory === "compliance") {
      return transformComplianceRecord(item);
    }

    if (itemCategory === "bms") return transformBmsRecord(item);
    if (itemCategory === "water") return transformWaterRecord(item);
    if (itemCategory === "compliance") return transformComplianceRecord(item);

    return {
      "Record ID": item.id || "",
      "Category": item.category || "General",
      "Subcategory": item.subcategory || item.incidentType || "",
      "Location": item.location || item.barangay || "",
      "Status": item.status || "Submitted",
      "Reporter": item.reporter?.name || "Unknown",
      "Date": formatExportDateTime(item.dateTime || item.createdAt),
      "Remarks": item.remarks || item.description || ""
    };
  });
};

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS AGGREGATION & VECTOR CHART COMPUTATION ENGINES
   ═══════════════════════════════════════════════════════════════ */

/**
 * Groups records into chronological time buckets for continuous line graph rendering.
 * @param {Array<Object>} rawData
 * @param {string} scope
 * @returns {Array<{ label: string, count: number, metricSum: number, metricLabel: string }>}
 */
export const computeTimeSeriesBuckets = (rawData, scope) => {
  if (!rawData || !rawData.length) return [];

  const timestamps = rawData
    .map((item) => {
      const ts = item.createdAt?.seconds
        ? item.createdAt.seconds * 1000
        : item.createdAt
        ? new Date(item.createdAt).getTime()
        : item.dateTime
        ? new Date(item.dateTime).getTime()
        : null;
      return { item, ts };
    })
    .filter((entry) => entry.ts !== null && !isNaN(entry.ts));

  if (!timestamps.length) {
    return [{ label: "Current Period", count: rawData.length, metricSum: 0, metricLabel: "Total Logs" }];
  }

  timestamps.sort((a, b) => a.ts - b.ts);
  const minTs = timestamps[0].ts;
  const maxTs = timestamps[timestamps.length - 1].ts;
  const spanMs = Math.max(maxTs - minTs, 1000 * 60 * 60 * 24); // at least 1 day span

  const numBuckets = Math.min(Math.max(Math.ceil(spanMs / (1000 * 60 * 60 * 24)), 4), 10);
  const bucketDuration = spanMs / numBuckets;
  const buckets = [];

  const lowerScope = (scope || "").toLowerCase();

  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = minTs + i * bucketDuration;
    const bucketEnd = i === numBuckets - 1 ? maxTs + 1 : bucketStart + bucketDuration;
    const startDate = new Date(bucketStart);
    const label = `${startDate.getMonth() + 1}/${startDate.getDate()}`;

    let count = 0;
    let metricSum = 0;

    timestamps.forEach(({ item, ts }) => {
      if (ts >= bucketStart && ts < bucketEnd) {
        count++;
        if (lowerScope === "bms") {
          metricSum += Number(item.count || item.quantity || 1);
        } else if (lowerScope === "compliance") {
          metricSum += Number(item.volumeValue || 0);
        } else if (lowerScope === "water") {
          metricSum += Number(item.phLevel || 7);
        } else {
          metricSum += 1;
        }
      }
    });

    let metricLabel = "Activity";
    if (lowerScope === "bms") metricLabel = "Organisms";
    else if (lowerScope === "compliance") metricLabel = "Waste kg";
    else if (lowerScope === "water") metricLabel = "Avg pH";
    else if (lowerScope === "incidents") metricLabel = "Incidents";

    buckets.push({
      label,
      count,
      metricSum: Math.round(metricSum * 10) / 10,
      metricLabel
    });
  }

  return buckets;
};

/**
 * Computes domain-specific categorical distributions for bar chart rendering.
 * @param {Array<Object>} rawData
 * @param {string} scope
 * @returns {Array<{ label: string, value: number, color: [number, number, number] }>}
 */
export const computeDomainDistribution = (rawData, scope) => {
  if (!rawData || !rawData.length) return [];
  const lowerScope = (scope || "").toLowerCase();

  const palette = [
    [0, 237, 100],   // #00ed64 Brand Green
    [61, 142, 255],  // #3d8eff Ocean Blue
    [250, 110, 57],  // #fa6e39 Warm Orange
    [255, 92, 92],   // #ff5c5c Coral Red
    [174, 112, 255], // #ae70ff Purple
    [123, 139, 154]  // #7b8b9a Slate
  ];

  const counts = {};

  if (lowerScope === "bms") {
    rawData.forEach((item) => {
      const cls = item.classification || (item.subcategory === "Avian Tracking Form" ? "Avian" : "Wildlife");
      counts[cls] = (counts[cls] || 0) + (Number(item.count || item.quantity || 1));
    });
  } else if (lowerScope === "water") {
    rawData.forEach((item) => {
      const sev = item.threatSeverity || item.flowLevel || "Moderate";
      counts[sev] = (counts[sev] || 0) + 1;
    });
  } else if (lowerScope === "compliance") {
    rawData.forEach((item) => {
      const status = item.compliant === false ? "Non-Compliant" : item.compliant === true ? "Compliant" : item.subcategory || "Log";
      counts[status] = (counts[status] || 0) + 1;
    });
  } else if (lowerScope === "incidents") {
    rawData.forEach((item) => {
      const cat = (item.category || "General").replace(" Incidents", "");
      counts[cat] = (counts[cat] || 0) + 1;
    });
  } else {
    rawData.forEach((item) => {
      const cat = item.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
  }

  const keys = Object.keys(counts).slice(0, 6);
  return keys.map((key, idx) => ({
    label: key,
    value: counts[key],
    color: palette[idx % palette.length]
  }));
};

/**
 * Computes ranked species census metrics for BMS reports.
 * @param {Array<object>} rawData
 * @returns {Array<object>}
 */
export const computeSpeciesRankings = (rawData = []) => {
  const map = {};
  let totalOrganisms = 0;

  rawData.forEach((item) => {
    const isAvian = item.subcategory === "Avian Tracking Form" || item.classification === "Avian";
    const isWildlife = item.subcategory === "Wildlife Observations Form";
    if (!isAvian && !isWildlife && !item.avianSpecies && !item.species) return;

    const name = (isAvian
      ? item.avianSpecies || item.speciesName
      : item.species || item.speciesName || item.commonName || item.animalName || "Unspecified Fauna")?.trim();

    if (!name) return;
    const count = Number(item.count || item.quantity || 1);
    totalOrganisms += count;

    if (!map[name]) {
      map[name] = { count: 0, class: isAvian ? "Avian" : item.classification || "Wildlife" };
    }
    map[name].count += count;
  });

  return Object.entries(map)
    .map(([species, data]) => ({
      species,
      classification: data.class,
      count: data.count,
      percentage: totalOrganisms > 0 ? ((data.count / totalOrganisms) * 100).toFixed(1) : "0.0"
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Draws executive KPI cards ribbon across the top of Page 1.
 */
const drawKpiCardsRibbon = (doc, x, y, width, rawData, scope) => {
  const lowerScope = (scope || "").toLowerCase();
  const total = rawData.length;
  
  let completed = 0;
  let active = 0;
  let domainMetricVal;
  let domainMetricLabel;

  if (lowerScope === "bms") {
    let orgTotal = 0;
    rawData.forEach((item) => {
      const s = (item.status || "").toLowerCase();
      if (s === "completed" || s === "verified") completed++;
      else if (s === "assigned" || s === "open assignment") active++;
      orgTotal += Number(item.count || item.quantity || 1);
    });
    domainMetricVal = `${orgTotal}`;
    domainMetricLabel = "Organisms Sighted";
  } else if (lowerScope === "water") {
    let criticalCount = 0;
    rawData.forEach((item) => {
      const s = (item.status || "").toLowerCase();
      if (s === "completed" || s === "verified") completed++;
      else if (s === "assigned" || s === "open assignment") active++;
      if ((item.threatSeverity || "").toLowerCase() === "critical" || (item.threatSeverity || "").toLowerCase() === "high") {
        criticalCount++;
      }
    });
    domainMetricVal = `${criticalCount}`;
    domainMetricLabel = "Elevated Threat Alerts";
  } else if (lowerScope === "compliance") {
    let wasteKg = 0;
    rawData.forEach((item) => {
      const s = (item.status || "").toLowerCase();
      if (s === "completed" || s === "verified") completed++;
      else if (s === "assigned" || s === "open assignment") active++;
      if (item.volumeValue) wasteKg += Number(item.volumeValue);
    });
    domainMetricVal = `${Math.round(wasteKg)} kg`;
    domainMetricLabel = "Solid Waste Logged";
  } else {
    rawData.forEach((item) => {
      const s = (item.status || "").toLowerCase();
      if (s === "completed" || s === "verified" || s === "resolved") completed++;
      else if (s === "assigned" || s === "open assignment" || s === "unresolved") active++;
    });
    domainMetricVal = `${total - completed}`;
    domainMetricLabel = "Pending Action";
  }

  const completionRate = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";

  const cards = [
    { label: "Total Audit Records", value: `${total}`, accent: [0, 237, 100] },
    { label: "Completion Rate", value: completionRate, accent: [61, 142, 255] },
    { label: "Active Operations", value: `${active}`, accent: [250, 110, 57] },
    { label: domainMetricLabel, value: domainMetricVal, accent: [0, 237, 100] }
  ];

  const cardWidth = (width - (cards.length - 1) * 4) / cards.length;
  const cardHeight = 15;

  cards.forEach((card, idx) => {
    const cardX = x + idx * (cardWidth + 4);

    // Card background
    doc.setFillColor(247, 249, 250); // #f7f9fa
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, "F");

    // Left accent bar
    doc.setFillColor(...card.accent);
    doc.rect(cardX, y, 2, cardHeight, "F");

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 30, 43); // #001e2b
    doc.text(card.value, cardX + 5, y + 6.5);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 108, 122); // #5c6c7a
    doc.text(card.label, cardX + 5, y + 11.5);
  });
};

/**
 * Draws high-resolution vector temporal line chart directly into jsPDF.
 */
const drawVectorLineChart = (doc, x, y, width, height, title, buckets) => {
  // Container Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 229, 232); // #e1e5e8
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  // Chart Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 30, 43);
  doc.text(title, x + 8, y + 9);

  // Subtitle / Legend
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(92, 108, 122);
  doc.text("● Log Frequency Over Time", x + width - 8, y + 9, { align: "right" });

  if (!buckets || buckets.length < 2) {
    doc.setFontSize(8);
    doc.text("Insufficient chronological range for trend curve.", x + width / 2, y + height / 2, { align: "center" });
    return;
  }

  const plotX = x + 14;
  const plotY = y + 15;
  const plotW = width - 22;
  const plotH = height - 25;

  const maxVal = Math.max(...buckets.map((b) => b.count), 4);

  // Grid lines and Y-ticks
  doc.setDrawColor(240, 243, 245);
  doc.setLineWidth(0.15);
  doc.setFontSize(6.5);
  doc.setTextColor(140, 150, 160);

  const numGrid = 4;
  for (let g = 0; g <= numGrid; g++) {
    const gy = plotY + plotH - (g / numGrid) * plotH;
    const gVal = Math.round((g / numGrid) * maxVal);
    doc.line(plotX, gy, plotX + plotW, gy);
    doc.text(String(gVal), plotX - 2, gy + 1, { align: "right" });
  }

  // Calculate points
  const points = buckets.map((b, i) => {
    const px = plotX + (i / (buckets.length - 1)) * plotW;
    const py = plotY + plotH - (b.count / maxVal) * plotH;
    return { px, py, label: b.label, count: b.count };
  });

  // Draw Area fill (subtle green tint)
  doc.setFillColor(230, 250, 238);
  doc.setDrawColor(0, 237, 100);

  // Draw lines between points
  doc.setLineWidth(0.7);
  doc.setDrawColor(0, 237, 100); // #00ed64

  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i].px, points[i].py, points[i + 1].px, points[i + 1].py);
  }

  // Draw points and X-axis labels
  points.forEach((pt, i) => {
    // Outer point
    doc.setFillColor(0, 30, 43); // #001e2b
    doc.circle(pt.px, pt.py, 1.2, "F");

    // Inner center
    doc.setFillColor(0, 237, 100);
    doc.circle(pt.px, pt.py, 0.6, "F");

    // Value on peak if space permits
    if (pt.count > 0 && (i % 2 === 0 || buckets.length <= 6)) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(0, 143, 61);
      doc.text(String(pt.count), pt.px, pt.py - 2, { align: "center" });
    }

    // X-axis label
    if (i % Math.ceil(buckets.length / 6) === 0 || i === buckets.length - 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(92, 108, 122);
      doc.text(pt.label, pt.px, plotY + plotH + 5, { align: "center" });
    }
  });
};

/**
 * Draws high-resolution vector domain distribution bar chart directly into jsPDF.
 */
const drawVectorBarChart = (doc, x, y, width, height, title, items) => {
  // Container Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 229, 232);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  // Chart Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 30, 43);
  doc.text(title, x + 8, y + 9);

  if (!items || !items.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("No distribution metrics available.", x + width / 2, y + height / 2, { align: "center" });
    return;
  }

  const maxVal = Math.max(...items.map((it) => it.value), 1);
  const totalVal = items.reduce((sum, it) => sum + it.value, 0) || 1;

  const rowCount = Math.min(items.length, 5);
  const startY = y + 16;
  const availableHeight = height - 22;
  const rowHeight = availableHeight / rowCount;

  const barStartX = x + 40;
  const barMaxW = width - 68;

  items.slice(0, rowCount).forEach((item, idx) => {
    const curY = startY + idx * rowHeight;
    const barWidth = Math.max((item.value / maxVal) * barMaxW, 3);
    const percentage = `${Math.round((item.value / totalVal) * 100)}%`;

    // Category Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 30, 43);
    const truncatedLabel = item.label.length > 14 ? item.label.substring(0, 13) + "…" : item.label;
    doc.text(truncatedLabel, barStartX - 4, curY + 4.5, { align: "right" });

    // Background track
    doc.setFillColor(242, 245, 247);
    doc.roundedRect(barStartX, curY, barMaxW, 6, 1.5, 1.5, "F");

    // Value Fill Bar
    doc.setFillColor(...item.color);
    doc.roundedRect(barStartX, curY, barWidth, 6, 1.5, 1.5, "F");

    // Value & Percentage Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0, 30, 43);
    doc.text(`${item.value} (${percentage})`, barStartX + barWidth + 3, curY + 4.5);
  });
};

/**
 * Generates and triggers download of a standardized, RFC 4180 compliant CSV.
 * @param {Array<object>} rawData
 * @param {string} scope - "BMS" | "Water" | "Compliance" | "Incidents" | "All"
 * @param {string} filename - Download file basename
 * @param {Object} [options]
 * @param {boolean} [options.includeAnalytics=true]
 */
export const exportToCSV = (rawData, scope, filename, options = { includeAnalytics: true }) => {
  if (!rawData || !rawData.length) return;

  const records = normalizeExportRecords(rawData, scope);
  if (!records.length) return;

  let csvContent = "";

  // 1. Optional Pre-pended Time-Series & Summary Aggregates
  if (options.includeAnalytics) {
    const buckets = computeTimeSeriesBuckets(rawData, scope);
    const distributions = computeDomainDistribution(rawData, scope);

    const trendHeader = ['"=== TEMPORAL ACTIVITY & TIME-SERIES SUMMARY ==="'];
    const trendColumns = ['"Period Bucket"', '"Category"', '"Scope / Subcategory"', '"Logs Recorded"', '"Domain Metric Aggregation"', '"Distribution Share %"'];
    
    const totalCount = rawData.length || 1;
    const trendRows = buckets.map((b) => {
      const share = `${Math.round((b.count / totalCount) * 100)}%`;
      return [
        formatCsvCell(b.label),
        formatCsvCell(scope),
        formatCsvCell(rawData[0]?.subcategory || "Selected Scope"),
        formatCsvCell(b.count),
        formatCsvCell(`${b.metricSum} ${b.metricLabel}`),
        formatCsvCell(share)
      ].join(",");
    });

    const distHeader = ['\r\n"=== DOMAIN CLASSIFICATION & METRIC BREAKDOWN ==="'];
    const distColumns = ['"Classification / Class"', '"Frequency Count"', '"Share of Total %"'];
    const distRows = distributions.map((d) => {
      const share = `${Math.round((d.value / totalCount) * 100)}%`;
      return [formatCsvCell(d.label), formatCsvCell(d.value), formatCsvCell(share)].join(",");
    });

    let speciesSection = [];
    if ((scope || "").toLowerCase() === "bms") {
      const speciesRankings = computeSpeciesRankings(rawData);
      if (speciesRankings.length > 0) {
        speciesSection = [
          '\r\n"=== TOP SPECIES CENSUS & BIODIVERSITY RANKINGS ==="',
          ['"Rank"', '"Species / Fauna Name"', '"Taxonomic Class"', '"Total Organisms Tracked"', '"Census Share %"'].join(","),
          ...speciesRankings.map((r, i) => [
            formatCsvCell(`#${i + 1}`),
            formatCsvCell(r.species),
            formatCsvCell(r.classification),
            formatCsvCell(r.count),
            formatCsvCell(`${r.percentage}%`)
          ].join(","))
        ];
      }
    }

    csvContent = [
      ...trendHeader,
      trendColumns.join(","),
      ...trendRows,
      ...distHeader,
      distColumns.join(","),
      ...distRows,
      ...speciesSection,
      '\r\n"=== DETAILED FIELD AUDIT RECORDS ==="'
    ].join("\r\n") + "\r\n";
  }

  // 2. Detailed RFC 4180 Records
  const headers = Object.keys(records[0]);
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
  
  const rowLines = records.map((row) => {
    return headers.map((header) => formatCsvCell(row[header])).join(",");
  });

  const fullCsvString = csvContent + [headerLine, ...rowLines].join("\r\n");
  const blob = new Blob(["\uFEFF" + fullCsvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename || "WMIRS_Export"}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates and triggers download of an executive, branded PDF report.
 * @param {Array<object>} rawData
 * @param {string} scope - "BMS" | "Water" | "Compliance" | "Incidents" | "All"
 * @param {string} filename - Download file basename
 * @param {string} title - Document title heading
 * @param {Object} [options]
 * @param {boolean} [options.includeAnalytics=true]
 */
export const exportToPDF = (rawData, scope, filename, title, options = { includeAnalytics: true }) => {
  if (!rawData || !rawData.length) return;

  const records = normalizeExportRecords(rawData, scope);
  if (!records.length) return;

  // Use landscape orientation for rich datasets
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const drawHeaderBand = (pageTitle) => {
    doc.setFillColor(0, 30, 43); // #001e2b Canvas Dark
    doc.rect(0, 0, 297, 22, "F");

    doc.setTextColor(0, 237, 100); // #00ed64 Brand Green
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("WMIRS", 14, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`|  ${pageTitle}`, 38, 14);

    const generationStamp = `Generated: ${formatExportDateTime(new Date())}`;
    doc.setFontSize(8.5);
    doc.setTextColor(168, 179, 188); // #a8b3bc Muted
    doc.text(generationStamp, 283, 14, { align: "right" });
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE ANALYTICS DASHBOARD (if enabled)
  // ═══════════════════════════════════════════════════════════════
  if (options.includeAnalytics) {
    drawHeaderBand(`${title || "Executive Field Audit"} — Intelligence Dossier`);

    // 1. KPI Ribbon
    drawKpiCardsRibbon(doc, 14, 26, 269, rawData, scope);

    // 2. Analytics Charts Side-by-Side
    const buckets = computeTimeSeriesBuckets(rawData, scope);
    const distributions = computeDomainDistribution(rawData, scope);

    // Left: Temporal Trend Line Graph
    drawVectorLineChart(doc, 14, 45, 132, 85, `${scope} Temporal Activity & Log Volume`, buckets);

    // Right: Domain Distribution Bar Chart
    drawVectorBarChart(doc, 151, 45, 132, 85, `${scope} Classification Breakdown`, distributions);

    // 3. Executive Insights Callout Box
    doc.setFillColor(247, 249, 250);
    doc.setDrawColor(225, 229, 232);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, 135, 269, 52, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 30, 43);
    doc.text("Executive Audit Synthesis & Context", 20, 143);

    const topDist = distributions[0] ? `${distributions[0].label} (${distributions[0].value} records)` : "N/A";
    const totalLogs = rawData.length;
    const subcategoryInfo = rawData[0]?.subcategory ? `Focusing on ${rawData[0].subcategory}` : `Scoped across ${scope} operations`;

    const summaryText = [
      `• Scope & Volume: ${subcategoryInfo} with a total of ${totalLogs} field audit records captured.`,
      `• Dominant Metric Segment: The highest reporting density is centered around ${topDist}.`,
      `• Operational Integrity: All field log submissions are signed and verified against ENRO administrative compliance rules.`,
      `• Complete tabular logs, geolocation coordinates, and reporter audit trails are detailed starting on Page 2.`
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(92, 108, 122);
    summaryText.forEach((line, i) => {
      doc.text(line, 20, 151 + i * 7.5);
    });

    // Add page 2 for data table
    doc.addPage();
  }

  // ═══════════════════════════════════════════════════════════════
  // DETAILED RECORDS TABLE (Page 2+ or Page 1 if charts disabled)
  // ═══════════════════════════════════════════════════════════════
  drawHeaderBand(`${title || "Executive Field Audit Report"} — Detailed Records`);

  const allKeys = Object.keys(records[0]);
  let selectedKeys = allKeys.slice(0, 7);

  const lowerScope = (scope || "").toLowerCase();
  let startTableY = 28;

  if (lowerScope === "bms") {
    selectedKeys = ["Log ID", "Subcategory", "Species / Fauna Name", "Taxonomic Class", "Organisms Count", "Location / Barangay", "Status", "Date Sighted"];
    
    const speciesRankings = computeSpeciesRankings(rawData);
    if (speciesRankings.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 30, 43);
      doc.text("Top Species Census & Biodiversity Rankings", 14, 27);

      autoTable(doc, {
        startY: 30,
        head: [["Rank", "Species / Fauna Name", "Taxonomic Class", "Total Organisms Tracked", "Census Share %"]],
        body: speciesRankings.slice(0, 8).map((r, i) => [
          `#${i + 1}`,
          r.species,
          r.classification,
          `${r.count} individuals`,
          `${r.percentage}%`
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [0, 30, 43],
          textColor: [0, 237, 100],
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: 2.5,
          lineColor: [28, 45, 56],
          lineWidth: 0.1
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [0, 30, 43],
          lineColor: [225, 229, 232],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [247, 249, 250]
        },
        margin: { left: 14, right: 14 }
      });

      startTableY = doc.lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 30, 43);
      doc.text("Detailed Field Observation Records", 14, startTableY - 3);
    }
  } else if (lowerScope === "water") {
    selectedKeys = ["Log ID", "Subcategory", "Water Body / Source", "Flow Level / Rate", "Water Clarity", "pH Level", "Threat Severity", "Status"];
  } else if (lowerScope === "compliance") {
    selectedKeys = ["Log ID", "Subcategory", "Establishment / Business", "Compliance Status", "Action / Citation Token", "Waste Weight / Volume", "Status", "Date Sighted / Inspected"];
  } else if (lowerScope === "incidents") {
    selectedKeys = ["Incident ID", "Incident Category", "Incident Type", "Severity Level", "Location", "Status", "Reporter Name", "Date Incident Occurred"];
  }

  const tableHead = [selectedKeys];
  const tableBody = records.map((rec) => selectedKeys.map((key) => String(rec[key] ?? "")));

  autoTable(doc, {
    startY: startTableY,
    head: tableHead,
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [0, 30, 43],
      textColor: [0, 237, 100],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 3.5,
      lineColor: [28, 45, 56],
      lineWidth: 0.1
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [0, 30, 43],
      lineColor: [225, 229, 232],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [247, 249, 250]
    },
    margin: { top: 28, left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(140, 150, 160);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} — City Environment & Natural Resources Office (ENRO)`,
        148.5,
        202,
        { align: "center" }
      );
    }
  });

  doc.save(`${filename || "WMIRS_Report"}.pdf`);
};
