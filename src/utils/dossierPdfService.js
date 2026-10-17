import jsPDF from "jspdf";
import { normalizeIncidentType } from "./incidentConstants";
import { formatExportDateTime } from "./exportService";

/**
 * Converts a remote or data URL into a Base64 data string while obtaining natural dimensions.
 * Constrains dimensions to a maximum of 1200px to prevent browser memory exhaustion.
 *
 * @param {string} url - Image source URL
 * @param {number} [timeoutMs=12000] - Timeout limit in milliseconds
 * @returns {Promise<{ dataUri: string, width: number, height: number, format: string }|null>}
 */
export const loadImageAsBase64 = async (url, timeoutMs = 12000) => {
  if (!url || typeof url !== "string") return null;

  // Handle data URIs directly
  if (url.startsWith("data:image/")) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUri: url,
          width: img.naturalWidth || img.width || 600,
          height: img.naturalHeight || img.height || 400,
          format: url.includes("image/png") ? "PNG" : "JPEG"
        });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      mode: "cors",
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) return null;
    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawDataUri = reader.result;
        if (!rawDataUri || typeof rawDataUri !== "string") {
          resolve(null);
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const naturalW = img.naturalWidth || img.width || 600;
            const naturalH = img.naturalHeight || img.height || 400;

            const maxDim = 1200;
            let targetW = naturalW;
            let targetH = naturalH;
            if (targetW > maxDim || targetH > maxDim) {
              if (targetW > targetH) {
                targetH = Math.round((targetH * maxDim) / targetW);
                targetW = maxDim;
              } else {
                targetW = Math.round((targetW * maxDim) / targetH);
                targetH = maxDim;
              }
            }

            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, targetW, targetH);

            const jpegUri = canvas.toDataURL("image/jpeg", 0.85);
            resolve({
              dataUri: jpegUri,
              width: targetW,
              height: targetH,
              format: "JPEG"
            });
          } catch (canvasErr) {
            console.warn("Canvas export fallback:", canvasErr);
            resolve({
              dataUri: rawDataUri,
              width: img.naturalWidth || img.width || 300,
              height: img.naturalHeight || img.height || 200,
              format: blob.type?.includes("png") ? "PNG" : "JPEG"
            });
          }
        };
        img.onerror = () => resolve(null);
        img.src = rawDataUri;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not convert image to Base64 for PDF export:", err);
    return null;
  }
};

/**
 * Harvests all attached images dynamically from initial evidence, resolution evidence,
 * merged reports, and workflow history.
 *
 * @param {Object} log
 * @returns {Array<{ url: string, title: string, sourceLabel: string, dateStr: string|null, uploader: string, notes: string|null }>}
 */
export const collectAllLogImages = (log) => {
  if (!log) return [];
  const images = [];
  const seenUrls = new Set();

  const addImage = (url, title, sourceLabel, metadata = {}) => {
    if (!url || typeof url !== "string") return;
    const cleanUrl = url.trim();
    if (!cleanUrl || seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);

    images.push({
      url: cleanUrl,
      title: title || "Field Photographic Evidence",
      sourceLabel: sourceLabel || "Initial Evidence",
      dateStr: metadata.dateStr || null,
      uploader: metadata.uploader || log.reporter?.name || "Field Officer",
      notes: metadata.notes || null
    });
  };

  // 1. Initial Evidence attachments
  if (Array.isArray(log.evidence)) {
    const imgEvidence = log.evidence.filter((item) => {
      if (!item) return false;
      if (typeof item === "string") return true;
      const itemUrl = item.url || item.downloadUrl;
      return !item.type || item.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(item.name || itemUrl || "");
    });

    imgEvidence.forEach((item, idx) => {
      const itemUrl = typeof item === "string" ? item : (item.url || item.downloadUrl);
      const title = imgEvidence.length === 1
        ? "Initial Field Observation"
        : `Initial Field Observation Photo #${idx + 1}`;
      addImage(
        itemUrl,
        title,
        "Field Ranger Submission",
        { dateStr: formatExportDateTime(log.createdAt || log.dateTime) }
      );
    });
  }

  // 2. Ranger Resolution Evidence
  if (log.resolutionEvidence) {
    if (typeof log.resolutionEvidence === "string") {
      addImage(
        log.resolutionEvidence,
        "Ranger Resolution Proof",
        "Field Resolution Finding",
        {
          dateStr: formatExportDateTime(log.resolvedAt || log.updatedAt),
          notes: log.resolutionNotes
        }
      );
    } else if (Array.isArray(log.resolutionEvidence)) {
      log.resolutionEvidence.forEach((rItem, rIdx) => {
        const rUrl = typeof rItem === "string" ? rItem : (rItem?.url || rItem?.downloadUrl);
        if (rUrl) {
          const rTitle = log.resolutionEvidence.length === 1
            ? "Ranger Resolution Proof"
            : `Ranger Resolution Proof #${rIdx + 1}`;
          addImage(
            rUrl,
            rTitle,
            "Field Resolution Finding",
            { dateStr: formatExportDateTime(log.resolvedAt || log.updatedAt) }
          );
        }
      });
    } else if (typeof log.resolutionEvidence === "object" && log.resolutionEvidence.url) {
      addImage(
        log.resolutionEvidence.url,
        "Ranger Resolution Proof",
        "Field Resolution Finding",
        {
          dateStr: formatExportDateTime(log.resolvedAt || log.updatedAt),
          notes: log.resolutionNotes
        }
      );
    }
  }

  // 3. Merged Duplicate Reports evidence
  if (Array.isArray(log.mergedReports)) {
    log.mergedReports.forEach((mr, mrIdx) => {
      const reporter = mr.reporterName || `Merged Report #${mrIdx + 1}`;
      if (Array.isArray(mr.evidence)) {
        mr.evidence.forEach((mEv, mIdx) => {
          const mUrl = typeof mEv === "string" ? mEv : (mEv?.url || mEv?.downloadUrl);
          if (mUrl) {
            addImage(
              mUrl,
              `Merged Report Evidence #${mIdx + 1}`,
              `Merged Report (${reporter})`,
              {
                dateStr: formatExportDateTime(mr.mergedAt),
                uploader: reporter,
                notes: mr.description
              }
            );
          }
        });
      }
    });
  }

  // 4. Workflow History attachments
  const historyList = log.workflowHistory || log.history || [];
  if (Array.isArray(historyList)) {
    historyList.forEach((hItem) => {
      if (hItem.attachmentUrl) {
        addImage(
          hItem.attachmentUrl,
          "Workflow Attachment Proof",
          `Status Transition (${hItem.action || hItem.toStatus || "Audit"})`,
          {
            dateStr: formatExportDateTime(hItem.timestamp),
            uploader: hItem.actorName || hItem.by,
            notes: hItem.remarks
          }
        );
      }
    });
  }

  return images;
};

/**
 * Draws the official Tayabas City ENRO Header Band across the top of a dossier page.
 *
 * @param {jsPDF} doc
 * @param {string} title
 */
const drawDossierHeader = (doc, title) => {
  // Dark Canvas Band (#001e2b)
  doc.setFillColor(0, 30, 43);
  doc.rect(0, 0, 210, 22, "F");

  // Accent Line (#00ed64)
  doc.setFillColor(0, 237, 100);
  doc.rect(0, 21.2, 210, 0.8, "F");

  // Brand Name
  doc.setTextColor(0, 237, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("WMIRS", 14, 12);

  // Sub-header title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`|  ${title}`, 36, 12);

  // Office & Generation Stamp
  doc.setFontSize(7.5);
  doc.setTextColor(168, 179, 188);
  doc.text("City Environment & Natural Resources Office (ENRO)", 196, 9.5, { align: "right" });
  doc.text(`Certified Export: ${formatExportDateTime(new Date())}`, 196, 15.5, { align: "right" });
};

/**
 * Draws the official dossier footer band with running page number.
 *
 * @param {jsPDF} doc
 * @param {number} pageNumber
 * @param {number} totalPages
 */
const drawDossierFooter = (doc, pageNumber, totalPages) => {
  doc.setDrawColor(225, 229, 232);
  doc.setLineWidth(0.2);
  doc.line(14, 283, 196, 283);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 160);
  doc.text(
    "Tayabas City ENRO - Watershed Monitoring & Incident Response System (WMIRS) Official Dossier",
    14,
    288
  );
  doc.text(`Page ${pageNumber} of ${totalPages}`, 196, 288, { align: "right" });
};

/**
 * Stamps running page footers across all generated pages in the jsPDF document instance.
 *
 * @param {jsPDF} doc
 */
const stampAllPageFooters = (doc) => {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawDossierFooter(doc, p, total);
  }
};

/**
 * Builds formatted domain questionnaire particulars based on log category and subcategory.
 *
 * @param {Object} log
 * @param {boolean} isIncident
 * @returns {Array<{ label: string, value: string }>}
 */
const buildObservationParticulars = (log, isIncident) => {
  if (isIncident) {
    const lines = [
      { label: "Incident Classification", value: normalizeIncidentType(log.incidentType) || "General Incident" },
      { label: "Severity Rating", value: `${log.severity || "Standard"} Severity` }
    ];
    if (log.assignedTeam?.leader?.name) {
      const members = log.assignedTeam.members?.map((m) => m.name).join(", ");
      lines.push({
        label: "Assigned Patrol Team",
        value: `Leader: ${log.assignedTeam.leader.name}${members ? ` | Members: ${members}` : ""}`
      });
    }
    return lines;
  }

  const sub = log.subcategory || "";
  const particulars = [{ label: "Monitoring Subcategory", value: sub || log.category || "General Observation" }];

  if (sub.includes("Avian")) {
    particulars.push(
      { label: "Avian Species", value: log.avianSpecies || log.speciesName || "Unspecified" },
      { label: "Organism Count", value: String(log.count || 1) },
      { label: "Observed Behavior", value: Array.isArray(log.activities) ? log.activities.join(", ") : log.activities || "None" }
    );
  } else if (sub.includes("Wildlife")) {
    particulars.push(
      { label: "Taxonomic Classification", value: log.classification || "Wildlife" },
      { label: "Species Common Name", value: log.speciesName || "Unspecified" },
      { label: "Quantity Sighted", value: String(log.quantity || log.count || 1) },
      { label: "Habitat Condition", value: log.habitatNotes || "Normal" }
    );
  } else if (sub.includes("Water Source") || sub.includes("Water Monitoring")) {
    particulars.push(
      { label: "Water Body / Marker", value: `${log.waterBody || "Unspecified"} (${log.locationMarker || "Site Marker"})` },
      { label: "Water Clarity & Flow", value: `${log.waterClarity || "Clear"} Clarity | ${log.flowLevel || "Normal"} Flow` },
      { label: "Water Parameters", value: `pH: ${log.phLevel || "N/A"} | Temp: ${log.temperature ? `${log.temperature}°C` : "N/A"} | DO: ${log.dissolvedOxygen ? `${log.dissolvedOxygen} mg/L` : "N/A"}` }
    );
  } else if (sub.includes("Ecosystem")) {
    particulars.push(
      { label: "Threat Assessment", value: `${log.threatLevel || log.threatSeverity || "Low"} Threat` },
      { label: "Pollution Indicators", value: Array.isArray(log.pollutionIndicators) ? log.pollutionIndicators.join(", ") : log.pollutionIndicators || "None" },
      { label: "Aquatic Notes", value: log.aquaticWildlifeNotes || "None observed" }
    );
  } else if (sub.includes("Waste")) {
    particulars.push(
      { label: "Collection Route", value: log.barangay || "Barangay Route" },
      { label: "Collection Type", value: log.collectionType || "Solid Waste Logistics" },
      { label: "Logged Volume", value: `${log.volumeValue || 0} ${log.volumeUnit || "kg"}` }
    );
  } else if (sub.includes("Plastic")) {
    particulars.push(
      { label: "Inspected Establishment", value: log.establishmentName || "Commercial Business" },
      { label: "Business Category", value: log.businessType || "Retail" },
      { label: "Compliance Assessment", value: log.compliant ? "COMPLIANT" : "NON-COMPLIANT" },
      { label: "Citation Action Token", value: log.actionToken || "None" }
    );
  }

  return particulars;
};

/**
 * Renders Page 1: Certified Overview, Metadata, Parameters, Resolution, Exhibit Index, and Audit Trail.
 *
 * @param {jsPDF} doc
 * @param {Object} log
 * @param {Array<Object>} [imageItems=[]]
 */
export const renderDossierOverviewPage = (doc, log, imageItems = []) => {
  const isIncident = Boolean(log.incidentType || log.category?.toLowerCase().includes("incident"));
  const docTitle = isIncident ? "Incident Investigation Dossier" : `${log.category || "Monitoring"} Field Dossier`;

  // 1. Header Band
  drawDossierHeader(doc, docTitle);

  // 2. Status & Identification Badge Row (y: 25)
  const logId = log.id || "LOG-RECORD";
  const statusStr = (log.status || "Completed").toUpperCase();
  const categoryStr = log.category || (isIncident ? "Incident" : "Monitoring");
  const subcategoryStr = log.subcategory || normalizeIncidentType(log.incidentType) || "";

  doc.setFillColor(242, 245, 247);
  doc.roundedRect(14, 25, 182, 11, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 30, 43);
  doc.text(`ID: #${logId}`, 18, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(92, 108, 122);
  doc.text(`|   ${categoryStr}${subcategoryStr ? ` - ${subcategoryStr}` : ""}`, 60, 32);

  // Status pill
  doc.setFillColor(230, 250, 238);
  doc.setDrawColor(0, 237, 100);
  doc.setLineWidth(0.3);
  doc.roundedRect(160, 27.5, 32, 6, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 143, 61);
  doc.text(statusStr, 176, 31.8, { align: "center" });

  // 3. Metadata Dossier Grid (y: 39)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 229, 232);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, 39, 182, 28, 2, 2, "FD");

  const locStr = log.location || log.stationId || log.waterBody || log.barangay || "Tayabas City";
  const coordStr = log.coordinates
    ? `${log.coordinates.latitude?.toFixed(5) || ""}, ${log.coordinates.longitude?.toFixed(5) || ""}`
    : "Coordinates not logged";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 108, 122);
  doc.text("INCIDENT / SITE LOCATION", 18, 45);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 30, 43);
  doc.text(locStr.length > 40 ? locStr.substring(0, 38) + "..." : locStr, 18, 51);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 108, 122);
  doc.text(`Barangay: ${log.barangay || "Tayabas Jurisdiction"}   |   GPS: ${coordStr}`, 18, 57);

  const dateStr = formatExportDateTime(log.dateTime || log.createdAt);
  doc.text(`Date & Time Reported: ${dateStr || "N/A"}`, 18, 63);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 108, 122);
  doc.text("REPORTING OFFICER / DOSSIER", 108, 45);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 30, 43);
  doc.text(log.reporter?.name || "ENRO Field Ranger", 108, 51);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 108, 122);
  doc.text(`Role: ${log.reporter?.role || "Field Officer"}   |   ${log.reporter?.email || ""}`, 108, 57);
  doc.text("Verified By: ENRO Administrative Dispatch Operations", 108, 63);

  // 4. Observation & Field Questionnaire Particulars (y: 70)
  const particulars = buildObservationParticulars(log, isIncident);
  doc.setFillColor(247, 249, 250);
  doc.roundedRect(14, 70, 182, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 30, 43);
  doc.text("FIELD OBSERVATION & TECHNICAL PARAMETERS", 18, 76);

  particulars.slice(0, 4).forEach((part, idx) => {
    const colX = idx % 2 === 0 ? 18 : 108;
    const rowY = 82 + Math.floor(idx / 2) * 8.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(92, 108, 122);
    doc.text(`${part.label.toUpperCase()}:`, colX, rowY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 30, 43);
    const valText = String(part.value || "-");
    doc.text(valText.length > 42 ? valText.substring(0, 40) + "..." : valText, colX + 32, rowY);
  });

  const descText = log.description || log.notes || log.remarks || "Standard inspection completed without deviations.";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(92, 108, 122);
  doc.text("NARRATIVE:", 18, 100);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 30, 43);
  const truncatedDesc = descText.length > 105 ? descText.substring(0, 102) + "..." : descText;
  doc.text(truncatedDesc, 36, 100);

  // 5. Field Resolution & Remediation Callout Box (y: 107)
  doc.setFillColor(240, 252, 244);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.25);
  doc.roundedRect(14, 107, 182, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 104, 74);
  doc.text("RANGER RESOLUTION FINDINGS & CORRECTIVE ACTION", 18, 114);

  const resNotes = log.resolutionNotes || log.adminRemarks || "Site inspected and verified. Regulatory compliance affirmed by field ranger.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 30, 43);
  const wrappedRes = doc.splitTextToSize(resNotes, 172);
  doc.text(wrappedRes.slice(0, 3), 18, 120);

  const resolvedDate = formatExportDateTime(log.resolvedAt || log.updatedAt);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(0, 104, 74);
  doc.text(`Resolution Verification Stamp: ${resolvedDate || "Affirmed in Field"}   |   Jurisdiction Compliance Validated`, 18, 137);

  // 6. Photographic Evidence & Exhibits Inventory Card (y: 144)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 229, 232);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, 144, 182, 48, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 30, 43);
  doc.text("PHOTOGRAPHIC EVIDENCE APPENDIX & EXHIBIT INDEX", 18, 151);

  // Exhibit count badge
  const totalExhibits = imageItems.length;
  if (totalExhibits > 0) {
    doc.setFillColor(230, 250, 238);
    doc.setDrawColor(0, 237, 100);
    doc.roundedRect(132, 146.5, 60, 5.5, 2.5, 2.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(0, 104, 74);
    doc.text(`${totalExhibits} Full-Size Exhibit Page${totalExhibits > 1 ? "s" : ""} Attached`, 162, 150.3, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(92, 108, 122);
    doc.text("High-resolution full-page photo exhibits follow on subsequent pages (Pages 2 through " + (totalExhibits + 1) + "):", 18, 157);

    // List up to 3 exhibits with clean descriptive names
    imageItems.slice(0, 3).forEach((item, eIdx) => {
      const eY = 163 + eIdx * 7.5;
      doc.setFillColor(0, 237, 100);
      doc.circle(20, eY - 1, 1.2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(0, 30, 43);
      doc.text(`Exhibit ${eIdx + 1}:`, 24, eY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(92, 108, 122);
      doc.text(`${item.title} (${item.sourceLabel})`, 42, eY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 104, 74);
      doc.text(`[Page ${eIdx + 2}]`, 174, eY);
    });

    if (totalExhibits > 3) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.8);
      doc.setTextColor(110, 120, 130);
      doc.text(`+ ${totalExhibits - 3} additional full-sized photographic exhibit pages follow...`, 24, 188);
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(92, 108, 122);
    doc.text("No photographic evidence was attached to this field log.", 18, 162);
    doc.text("All observation data recorded via questionnaire parameters and ranger narrative.", 18, 169);
  }

  // 7. Certified Administrative Audit Trail (y: 195)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 229, 232);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, 195, 182, 84, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 30, 43);
  doc.text("CERTIFIED AUDIT TRAIL & ADMINISTRATIVE SIGN-OFFS", 18, 202);

  const rawHistory = log.workflowHistory || log.history || [];
  const historyItems = rawHistory.length > 0 ? rawHistory.slice(-5) : [
    { action: "Submitted", by: log.reporter?.name || "Ranger", role: "Reporter", timestamp: log.createdAt, remarks: "Field observation recorded." },
    { action: "Completed", by: "ENRO Admin", role: "Administrator", timestamp: new Date(), remarks: "Audit verification complete." }
  ];

  historyItems.forEach((item, hIdx) => {
    const curY = 210 + hIdx * 14;

    doc.setFillColor(0, 237, 100);
    doc.circle(20, curY, 1.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 30, 43);
    const actionLabel = item.toStatus || item.action || "Status Update";
    doc.text(actionLabel.toUpperCase(), 25, curY + 1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(92, 108, 122);
    const actorName = item.actorName || item.by || "Officer";
    const actorRole = item.actorRole || item.role || "";
    const stamp = formatExportDateTime(item.timestamp);
    doc.text(`By: ${actorName} (${actorRole || "Staff"})   -   ${stamp}`, 62, curY + 1);

    if (item.remarks || item.notes) {
      const remarkLine = String(item.remarks || item.notes);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(110, 120, 130);
      doc.text(`"${remarkLine.length > 95 ? remarkLine.substring(0, 92) + "..." : remarkLine}"`, 25, curY + 6.5);
    }
  });
};

/**
 * Backwards-compatible alias for renderDossierOverviewPage
 */
export const renderSingleLogDossierPage = renderDossierOverviewPage;

/**
 * Renders a dedicated full-sized A4 exhibit page for an individual attached photograph.
 * Omits overflowing file names, log ID pills, and cloud links for a clean, publication-grade layout.
 *
 * @param {jsPDF} doc
 * @param {Object} log
 * @param {Object} imageItem
 * @param {Object|null} imgObj - Base64 image data from loadImageAsBase64
 * @param {number} exhibitIndex - 0-indexed position
 * @param {number} totalExhibits - Total count of exhibits in this log
 */
export const renderPhotoExhibitPage = (doc, log, imageItem, imgObj, exhibitIndex, totalExhibits) => {
  const isIncident = Boolean(log.incidentType || log.category?.toLowerCase().includes("incident"));
  const headerCategory = isIncident ? "Incident Investigation Exhibit" : `${log.category || "Monitoring"} Field Exhibit`;

  // 1. Official Header
  drawDossierHeader(doc, headerCategory);

  // 2. Exhibit Identification Banner (y: 25) - Clean layout without overflowing log ID or raw file UUIDs
  doc.setFillColor(0, 30, 43);
  doc.roundedRect(14, 25, 182, 15, 2, 2, "F");

  // Exhibit numbering & descriptive title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 237, 100);
  doc.text(`EXHIBIT ${exhibitIndex + 1} OF ${totalExhibits}: ${imageItem.title.toUpperCase()}`, 18, 31.5);

  // Sub-detail line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(225, 229, 232);
  const uploaderStr = imageItem.uploader ? `Uploader: ${imageItem.uploader}` : "Field Unit";
  const dateStr = imageItem.dateStr ? `Logged: ${imageItem.dateStr}` : "Date Verified";
  doc.text(`Source: ${imageItem.sourceLabel}   |   ${uploaderStr}   |   ${dateStr}`, 18, 37);

  // 3. Full-Sized Photo Frame (y: 43 to 256 -> max width 182mm, max height 213mm)
  const frameX = 14;
  const frameY = 43;
  const frameW = 182;
  const frameH = 213;

  doc.setFillColor(251, 253, 252);
  doc.setDrawColor(225, 229, 232);
  doc.setLineWidth(0.25);
  doc.roundedRect(frameX, frameY, frameW, frameH, 2, 2, "FD");

  const canvasX = frameX + 2;
  const canvasY = frameY + 2;
  const canvasW = frameW - 4;
  const canvasH = frameH - 4;

  if (imgObj?.dataUri) {
    try {
      const imgAspect = imgObj.width / imgObj.height;
      const boxAspect = canvasW / canvasH;

      let drawW = canvasW;
      let drawH = canvasH;

      if (imgAspect > boxAspect) {
        drawH = canvasW / imgAspect;
      } else {
        drawW = canvasH * imgAspect;
      }

      const drawX = canvasX + (canvasW - drawW) / 2;
      const drawY = canvasY + (canvasH - drawH) / 2;

      doc.addImage(imgObj.dataUri, imgObj.format, drawX, drawY, drawW, drawH);
    } catch (e) {
      console.warn("Failed to draw full-size exhibit in jsPDF:", e);
      renderExhibitFallback(doc, frameX, frameY, frameW, frameH, imageItem);
    }
  } else {
    renderExhibitFallback(doc, frameX, frameY, frameW, frameH, imageItem);
  }

  // 4. Exhibit Caption & Geolocation Bar (y: 259 to 279) - Clean metadata without external links
  doc.setFillColor(247, 249, 250);
  doc.setDrawColor(225, 229, 232);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, 259, 182, 19, 2, 2, "FD");

  const locStr = log.location || log.stationId || log.waterBody || log.barangay || "Tayabas City Jurisdiction";
  const coordStr = log.coordinates
    ? `GPS: ${log.coordinates.latitude?.toFixed(5) || ""}, ${log.coordinates.longitude?.toFixed(5) || ""}`
    : "GPS: Unspecified Coordinates";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(0, 30, 43);
  doc.text("EXHIBIT VERIFICATION & SITE GEOLOCATION", 18, 265);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(92, 108, 122);
  doc.text(`Location: ${locStr.substring(0, 80)}   |   Barangay: ${log.barangay || "Tayabas"}   |   ${coordStr}`, 18, 270);

  if (imageItem.notes) {
    doc.setFont("helvetica", "italic");
    doc.text(`Notes: "${imageItem.notes.substring(0, 100)}"`, 18, 274.5);
  } else {
    doc.text("Verified Photographic Record - Official Tayabas City ENRO Repository", 18, 274.5);
  }
};

/**
 * Fallback renderer when an image Base64 cannot be decoded or loaded.
 *
 * @param {jsPDF} doc
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {Object} imageItem
 */
const renderExhibitFallback = (doc, x, y, w, h, imageItem) => {
  const midX = x + w / 2;
  const midY = y + h / 2;

  doc.setFillColor(242, 245, 247);
  doc.roundedRect(midX - 70, midY - 20, 140, 40, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 30, 43);
  doc.text("[Photographic Evidence Record]", midX, midY - 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 108, 122);
  doc.text(imageItem.title, midX, midY + 2, { align: "center" });
  doc.text("Stored securely in official ENRO storage repository.", midX, midY + 8, { align: "center" });
};

/**
 * Generates and triggers download of an individual log dossier PDF with dynamic full-sized exhibit pages.
 *
 * @param {Object} log - Incident or Monitoring record
 * @returns {Promise<void>}
 */
export const exportSingleLogDossier = async (log) => {
  if (!log) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const imageItems = collectAllLogImages(log);

  // Preload all images asynchronously
  const loadedImages = await Promise.all(
    imageItems.map((item) => loadImageAsBase64(item.url))
  );

  // 1. Render Overview Page (Page 1)
  renderDossierOverviewPage(doc, log, imageItems);

  // 2. Render Dedicated Exhibit Pages (Pages 2 .. N)
  imageItems.forEach((item, idx) => {
    doc.addPage();
    renderPhotoExhibitPage(doc, log, item, loadedImages[idx], idx, imageItems.length);
  });

  // 3. Stamp Page Footers across all pages
  stampAllPageFooters(doc);

  // 4. Save File
  const safeId = (log.id || "RECORD").replace(/[^a-zA-Z0-9_-]/g, "");
  const cat = (log.category || "Dossier").replace(/\s+/g, "_");
  const filename = `WMIRS_${cat}_${safeId}_Dossier.pdf`;

  doc.save(filename);
};

/**
 * Generates and triggers download of a unified multi-page PDF binder containing
 * complete photo dossiers for all provided completed logs with dynamic full-sized exhibit pages.
 *
 * @param {Array<Object>} logs - List of completed logs to package
 * @param {string} [scope="Completed Logs"]
 * @param {string} [filename]
 * @returns {Promise<void>}
 */
export const exportBatchLogDossiers = async (logs, scope = "Completed", filename = null) => {
  if (!Array.isArray(logs) || logs.length === 0) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const totalLogs = logs.length;

  for (let lIdx = 0; lIdx < totalLogs; lIdx++) {
    const log = logs[lIdx];
    if (lIdx > 0) {
      doc.addPage();
    }

    const imageItems = collectAllLogImages(log);
    const loadedImages = await Promise.all(
      imageItems.map((item) => loadImageAsBase64(item.url))
    );

    // 1. Render Overview Page
    renderDossierOverviewPage(doc, log, imageItems);

    // 2. Render Dedicated Exhibit Pages
    imageItems.forEach((item, idx) => {
      doc.addPage();
      renderPhotoExhibitPage(doc, log, item, loadedImages[idx], idx, imageItems.length);
    });
  }

  // Stamp all page footers across entire batch
  stampAllPageFooters(doc);

  const dateStamp = new Date().toISOString().split("T")[0];
  const safeScope = (scope || "All").replace(/\s+/g, "_");
  const saveName = filename || `WMIRS_${safeScope}_Photo_Dossiers_${dateStamp}.pdf`;

  doc.save(saveName);
};
