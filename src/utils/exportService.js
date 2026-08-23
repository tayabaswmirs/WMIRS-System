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

    // Global / Fallback Monitoring
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

/**
 * Generates and triggers download of a standardized, RFC 4180 compliant CSV.
 * @param {Array<object>} rawData
 * @param {string} scope - "BMS" | "Water" | "Compliance" | "Incidents" | "All"
 * @param {string} filename - Download file basename
 */
export const exportToCSV = (rawData, scope, filename) => {
  if (!rawData || !rawData.length) return;

  const records = normalizeExportRecords(rawData, scope);
  if (!records.length) return;

  const headers = Object.keys(records[0]);
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
  
  const rowLines = records.map((row) => {
    return headers.map((header) => formatCsvCell(row[header])).join(",");
  });

  const csvString = [headerLine, ...rowLines].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
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
 */
export const exportToPDF = (rawData, scope, filename, title) => {
  if (!rawData || !rawData.length) return;

  const records = normalizeExportRecords(rawData, scope);
  if (!records.length) return;

  // Use landscape orientation for rich datasets
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // 1. Executive Brand Header Band
  doc.setFillColor(0, 30, 43); // #001e2b Canvas Dark
  doc.rect(0, 0, 297, 24, "F");

  doc.setTextColor(0, 237, 100); // #00ed64 Brand Green
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("WMIRS", 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`|  ${title || "Executive Field Audit Report"}`, 40, 15);

  const generationStamp = `Generated: ${formatExportDateTime(new Date())}`;
  doc.setFontSize(9);
  doc.setTextColor(168, 179, 188); // #a8b3bc Muted
  doc.text(generationStamp, 283, 15, { align: "right" });

  // 2. Select the top key columns for clean PDF readability
  const allKeys = Object.keys(records[0]);
  let selectedKeys = allKeys.slice(0, 7); // Pick first 7 key columns for clean table

  // Tailored column selections for specific scopes to maximize readability
  const lowerScope = (scope || "").toLowerCase();
  if (lowerScope === "bms") {
    selectedKeys = ["Log ID", "Subcategory", "Species / Fauna Name", "Taxonomic Class", "Organisms Count", "Location / Barangay", "Status", "Date Sighted"];
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
    startY: 30,
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
    margin: { top: 30, left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      // Footer page numbering
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
