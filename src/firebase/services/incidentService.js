import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc,
  getDoc,
  getDocs,
  limit,
  deleteDoc,
  arrayUnion
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { db, storage } from "../firebase";
import { LOG_STATUS } from "../../utils/incidentConstants";

/**
 * Uploads a single file to Firebase Storage under user's folder.
 * 
 * @param {string} uid - The user's UID
 * @param {string} incidentId - The ID of the incident report
 * @param {File} file - The file object to upload
 * @param {function} onProgress - Callback for progress updates (receives percent 0-100)
 * @returns {Promise<{name: string, url: string, type: string}>}
 */
export const uploadEvidenceFile = (uid, incidentId, file, onProgress) => {
  return new Promise((resolve, reject) => {
    // Sanitize filename to prevent directory traversal issues
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, `users/${uid}/evidence/${incidentId}/${uniqueFilename}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error("Storage upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            name: file.name,
            url: downloadURL,
            type: file.type
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Detects whether an active report in the same category and barangay/location exists within 48h.
 * Uses limit(1) to consume only 0 or 1 Firestore document read.
 *
 * @param {string} category - Incident category (e.g. Forest Incidents)
 * @param {string} location - Barangay or location string
 * @returns {Promise<{ isPossibleDuplicate: boolean, matchedReportId: string, matchedTitle: string, matchedLocation: string, flaggedAt: string } | null>}
 */
export const detectActiveDuplicate = async (category, location) => {
  if (!category || !location) return null;
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const incidentsRef = collection(db, "incidents");
    const q = query(
      incidentsRef,
      where("category", "==", category),
      where("location", "==", location),
      where("status", "in", [LOG_STATUS.SUBMITTED, "Submitted", LOG_STATUS.ASSIGNED, LOG_STATUS.UNRESOLVED]),
      where("createdAt", ">=", cutoff),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const matched = snap.docs[0];
      const mData = matched.data();
      return {
        isPossibleDuplicate: true,
        matchedReportId: matched.id,
        matchedTitle: mData.subcategory || mData.incidentType || mData.category || "Active Incident",
        matchedLocation: location,
        flaggedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn("Could not check for duplicates (index building or network):", err);
  }
  return null;
};

/**
 * Creates a new incident report, uploads all evidence files, and saves metadata to Firestore.
 * Performs client-side idempotency using clientSubmissionId and 1-read duplicate detection.
 * 
 * @param {object} incidentData - Incident report data (category, incidentType, location, dateTime, description, severity, reporter details)
 * @param {Array<File>} files - Evidence files to upload
 * @param {function} onFileProgress - Callback tracking progress of file uploads: (fileIndex, progress)
 * @returns {Promise<string>} - Resolves to the created Incident ID
 */
export const createIncidentReport = async (incidentData, files, onFileProgress) => {
  // 1. Deterministic client submission ID prevents duplicate creates on retries
  const incidentId = incidentData.clientSubmissionId || 
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : doc(collection(db, "incidents")).id);
  const newIncidentDoc = doc(db, "incidents", incidentId);
  const uid = incidentData.reporter.uid;

  const uploadedEvidence = [];

  // 2. Upload files sequentially or in parallel
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadEvidenceFile(uid, incidentId, file, (progress) => {
        if (onFileProgress) {
          onFileProgress(i, progress);
        }
      });
      uploadedEvidence.push(result);
    }
  }

  // 3. Automated 1-read duplicate check
  let possibleDuplicate = null;
  try {
    possibleDuplicate = await detectActiveDuplicate(incidentData.category, incidentData.location);
  } catch (err) {
    console.warn("Error running duplicate check:", err);
  }

  // 4. Save incident document to Firestore
  const finalDocData = {
    ...incidentData,
    id: incidentId,
    clientSubmissionId: incidentId,
    evidence: uploadedEvidence,
    status: LOG_STATUS.SUBMITTED,
    possibleDuplicate: possibleDuplicate || null,
    createdAt: serverTimestamp()
  };

  await setDoc(newIncidentDoc, finalDocData);
  return incidentId;
};

/**
 * Subscribes to real-time incident reports submitted by a specific staff member.
 * 
 * @param {string} uid - User ID of the staff reporter
 * @param {function} callback - Callback received on updates
 * @returns {import("firebase/firestore").Unsubscribe}
 */
export const subscribeToReporterIncidents = (uid, callback) => {
  const q = query(
    collection(db, "incidents"),
    where("reporter.uid", "==", uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reports = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      // Sort client-side by createdAt descending to bypass composite index requirements
      reports.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      callback(reports);
    },
    (error) => {
      console.error("Error subscribing to reporter incidents:", error);
    }
  );
};

/**
 * Subscribes to incident reports filtered by a specific category (for Staff workspace).
 * 
 * @param {string} category - The staff member's assigned scope
 * @param {function} callback - Callback received on updates
 * @returns {import("firebase/firestore").Unsubscribe}
 */
export const subscribeToCategoryIncidents = (category, callback) => {
  const q = query(
    collection(db, "incidents"),
    where("category", "==", category)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reports = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      // Sort client-side by createdAt descending
      reports.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      callback(reports);
    },
    (error) => {
      console.error("Error subscribing to category incidents:", error);
    }
  );
};

/**
 * Subscribes to all real-time incident reports in the system (for Admin use).
 * 
 * @param {function} callback - Callback received on updates
 * @returns {import("firebase/firestore").Unsubscribe}
 */
export const subscribeToAllIncidents = (callback) => {
  const q = query(
    collection(db, "incidents"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reports = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      callback(reports);
    },
    (error) => {
      console.error("Error subscribing to all incidents:", error);
    }
  );
};

/**
 * Updates the status of a reported incident.
 * Writes an audit trail: updatedAt timestamp and updatedBy admin UID.
 *
 * @param {string} incidentId - Unique Firestore document ID
 * @param {string} status     - New status value ('Submitted' | 'Under Review' | 'Resolved' | 'Dismissed')
 * @param {string} adminUid   - UID of the admin performing the update
 * @returns {Promise<void>}
 */
export const updateIncidentStatus = async (incidentId, status, adminUid) => {
  const docRef = doc(db, "incidents", incidentId);
  const updatePayload = {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid
  };

  // If dismissing the report, delete all associated evidence from Storage to save space
  if (status === "Dismissed") {
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const evidence = docSnap.data().evidence || [];
        // Delete each file from Firebase Storage
        const deletePromises = evidence.map((file) => {
          if (file.url) {
            const fileRef = ref(storage, file.url);
            return deleteObject(fileRef).catch((e) => {
              console.warn(`Failed to delete storage file ${file.url}:`, e);
            });
          }
          return Promise.resolve();
        });
        
        await Promise.all(deletePromises);
        // Clear the evidence array in Firestore so we don't have broken links
        updatePayload.evidence = [];
      }
    } catch (err) {
      console.error("Error cleaning up evidence for dismissed report:", err);
    }
  }

  return updateDoc(docRef, updatePayload);
};

/**
 * Atomically updates the status of a reported incident.
 * Logs the action into the workflow history array.
 *
 * @param {string} incidentId - Unique Firestore document ID
 * @param {string} status     - New status value
 * @param {string} reviewerUid - UID of the staff performing the review
 * @param {string} reviewerName - Display name of the staff performing the review
 * @param {string} remarks    - Optional reviewer remarks
 * @returns {Promise<void>}
 */
export const reviewIncidentAtomic = async (incidentId, status, reviewerUid, reviewerName, remarks) => {
  return updateLogWorkflowStatus(incidentId, "Incident", status, reviewerUid, reviewerName, remarks);
};

/**
 * Admin override for incident status. 
 * Allows admins to forcefully change status and leave an audit trail.
 */
export const adminOverrideIncident = async (incidentId, status, adminUid, adminName, reason = "") => {
  const resolvedName = typeof adminName === "string" ? adminName : "Admin";
  const resolvedReason = typeof reason === "string" && reason ? reason : "Admin override via dashboard";
  return updateLogWorkflowStatus(incidentId, "Incident", status, adminUid, resolvedName, `ADMIN OVERRIDE: ${resolvedReason}`);
};

/**
 * Permanently deletes an incident report and its associated evidence from Storage.
 */
export const deleteIncidentReport = async (incidentId) => {
  const docRef = doc(db, "incidents", incidentId);
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const evidence = docSnap.data().evidence || [];
      const deletePromises = evidence.map((file) => {
        if (file.url) {
          const fileRef = ref(storage, file.url);
          return deleteObject(fileRef).catch((e) => {
            console.warn(`Failed to delete storage file ${file.url}:`, e);
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
    }
  } catch (err) {
    console.error("Error cleaning up evidence for deleted report:", err);
  }
  
  return deleteDoc(docRef);
};

/**
 * Atomic helper to update workflow status for ANY log (Incident or Monitoring).
 * Logs the action into the 'history' array.
 */
export const updateLogWorkflowStatus = async (id, logType, newStatus, uid, name, actionNotes = "", evidenceFile = null) => {
  const collectionName = logType === "Incident" ? "incidents" : "monitoring";
  const docRef = doc(db, collectionName, id);
  
  const historyEntry = {
    action: newStatus,
    by: name,
    uid: uid,
    timestamp: new Date().toISOString(),
    notes: actionNotes,
  };
  
  if (evidenceFile) {
    historyEntry.evidenceFile = evidenceFile;
  }
  
  const updatePayload = {
    status: newStatus,
    updatedAt: serverTimestamp(),
    updatedBy: { uid, name },
    history: arrayUnion(historyEntry)
  };
  
  if (newStatus === LOG_STATUS.RESOLVED) {
    updatePayload.resolutionNotes = actionNotes;
    if (evidenceFile) {
      updatePayload.resolutionEvidence = evidenceFile;
    }
  }

  return updateDoc(docRef, updatePayload);
};

/**
 * Subscribes to open assignments (status === 'assigned' or 'unresolved').
 * Automatically restricts Monitoring logs to the staff's category if staffScope is provided.
 */
export const subscribeToOpenAssignments = (callback, staffScope = null) => {
  const incidentsRef = collection(db, "incidents");
  const monitoringRef = collection(db, "monitoring");
  
  let qInc = null;
  let qMon = null;
  
  if (staffScope) {
    if (staffScope === "incidents") {
      qInc = query(incidentsRef, where("status", "in", [LOG_STATUS.ASSIGNED, LOG_STATUS.UNRESOLVED]));
    } else {
      qMon = query(
        monitoringRef, 
        where("category", "==", staffScope), 
        where("status", "in", [LOG_STATUS.ASSIGNED, LOG_STATUS.UNRESOLVED])
      );
    }
  } else {
    // For Admins/Rangers who have global access
    qInc = query(incidentsRef, where("status", "in", [LOG_STATUS.ASSIGNED, LOG_STATUS.UNRESOLVED]));
    qMon = query(monitoringRef, where("status", "in", [LOG_STATUS.ASSIGNED, LOG_STATUS.UNRESOLVED]));
  }
  
  let incidentsList = [];
  let monitoringList = [];
  
  const updateCombined = () => {
    const combined = [...incidentsList, ...monitoringList];
    combined.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
    callback(combined);
  };

  let unsubInc;
  if (qInc) {
    unsubInc = onSnapshot(qInc, (snapshot) => {
      incidentsList = snapshot.docs.map((d) => ({ id: d.id, logType: "Incident", ...d.data() }));
      updateCombined();
    });
  }

  let unsubMon;
  if (qMon) {
    unsubMon = onSnapshot(qMon, (snapshot) => {
      monitoringList = snapshot.docs.map((d) => ({ id: d.id, logType: "Monitoring", ...d.data() }));
      updateCombined();
    });
  }

  return () => {
    if (unsubInc) unsubInc();
    if (unsubMon) unsubMon();
  };
};

/**
 * Assigns an incident or monitoring report to a specific patrol team (Leader + Members).
 * Enforces the Section 4.5 Conflict of Interest invariant: reporter cannot be leader or member.
 *
 * @param {string} reportId - Document ID
 * @param {string} logType - "Incident" or "Monitoring"
 * @param {object} leader - { uid, name, email }
 * @param {Array<object>} members - Array of { uid, name, email }
 * @param {object} staffUser - { uid, name }
 * @returns {Promise<void>}
 */
export const assignTeamToReport = async (reportId, logType, leader, members = [], staffUser) => {
  const collectionName = logType === "Incident" ? "incidents" : "monitoring";
  const docRef = doc(db, collectionName, reportId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`${logType} document not found.`);
  }

  const data = docSnap.data();
  const reporterUid = data.reporter?.uid || data.submittedBy;

  // Invariant: Conflict of Interest Guard (Section 4.5)
  if (reporterUid) {
    if (leader.uid === reporterUid) {
      throw new Error("Conflict of Interest: The reporting officer cannot be assigned as Team Leader.");
    }
    if (members.some(m => m.uid === reporterUid)) {
      throw new Error("Conflict of Interest: The reporting officer cannot be assigned as a Team Member.");
    }
  }

  const assignedTeam = {
    leader: {
      uid: leader.uid,
      name: leader.name,
      email: leader.email || ""
    },
    members: members.map(m => ({
      uid: m.uid,
      name: m.name,
      email: m.email || ""
    })),
    assignedAt: new Date().toISOString(),
    assignedBy: {
      uid: staffUser.uid,
      name: staffUser.name || staffUser.displayName || "Staff Officer"
    }
  };

  const historyEntry = {
    action: LOG_STATUS.ASSIGNED,
    by: staffUser.name || staffUser.displayName || "Staff Officer",
    uid: staffUser.uid,
    role: "staff",
    timestamp: new Date().toISOString(),
    notes: `Assigned to team led by ${leader.name}${members.length > 0 ? ` with ${members.length} members` : ""}.`
  };

  return updateDoc(docRef, {
    status: LOG_STATUS.ASSIGNED,
    assignedTeam,
    updatedAt: serverTimestamp(),
    updatedBy: { uid: staffUser.uid, name: staffUser.name || staffUser.displayName || "Staff" },
    history: arrayUnion(historyEntry)
  });
};

/**
 * Merges a secondary duplicate report into an active master report.
 * Appends photos/evidence and description to master, and marks duplicate as merged_duplicate.
 *
 * @param {string} duplicateId - Duplicate report ID
 * @param {string} masterId - Master report ID
 * @param {string} logType - "Incident" or "Monitoring"
 * @param {object} staffUser - { uid, name }
 * @returns {Promise<void>}
 */
export const smartMergeDuplicate = async (duplicateId, masterId, logType, staffUser) => {
  const collectionName = logType === "Incident" ? "incidents" : "monitoring";
  const dupRef = doc(db, collectionName, duplicateId);
  const masterRef = doc(db, collectionName, masterId);

  const [dupSnap, masterSnap] = await Promise.all([getDoc(dupRef), getDoc(masterRef)]);
  if (!dupSnap.exists()) throw new Error("Duplicate report not found.");
  if (!masterSnap.exists()) throw new Error("Master report not found.");

  const dupData = dupSnap.data();
  const staffName = staffUser.name || staffUser.displayName || "Staff";

  // 1. Prepare merged entry to append to master report
  const mergedEntry = {
    sourceReportId: duplicateId,
    reporterName: dupData.reporter?.name || "Citizen / Ranger",
    reporterUid: dupData.reporter?.uid || "",
    description: dupData.description || "",
    evidence: dupData.evidence || [],
    mergedAt: new Date().toISOString(),
    mergedBy: { uid: staffUser.uid, name: staffName }
  };

  // 2. Update master document with mergedReports
  await updateDoc(masterRef, {
    mergedReports: arrayUnion(mergedEntry),
    updatedAt: serverTimestamp(),
    history: arrayUnion({
      action: "Merged Evidence",
      by: staffName,
      uid: staffUser.uid,
      role: "staff",
      timestamp: new Date().toISOString(),
      notes: `Merged duplicate report #${duplicateId} submitted by ${mergedEntry.reporterName}.`
    })
  });

  // 3. Mark duplicate document as merged_duplicate
  await updateDoc(dupRef, {
    status: LOG_STATUS.MERGED_DUPLICATE,
    mergedInto: {
      masterId,
      mergedAt: new Date().toISOString(),
      mergedBy: { uid: staffUser.uid, name: staffName }
    },
    updatedAt: serverTimestamp(),
    history: arrayUnion({
      action: LOG_STATUS.MERGED_DUPLICATE,
      by: staffName,
      uid: staffUser.uid,
      role: "staff",
      timestamp: new Date().toISOString(),
      notes: `Confirmed as duplicate and merged into master ticket #${masterId}.`
    })
  });
};

/**
 * Clears the possibleDuplicate flag on a report if confirmed as an independent incident.
 */
export const clearDuplicateFlag = async (reportId, logType, staffUser) => {
  const collectionName = logType === "Incident" ? "incidents" : "monitoring";
  const docRef = doc(db, collectionName, reportId);
  const staffName = staffUser.name || staffUser.displayName || "Staff";

  return updateDoc(docRef, {
    possibleDuplicate: null,
    updatedAt: serverTimestamp(),
    history: arrayUnion({
      action: "Flag Cleared",
      by: staffName,
      uid: staffUser.uid,
      role: "staff",
      timestamp: new Date().toISOString(),
      notes: "Possible duplicate flag dismissed by Staff; confirmed as independent report."
    })
  });
};

/**
 * Resolves an assignment by a ranger.
 * Validates Team Leader authority and uploads resolution evidence photo to Storage first.
 */
export const resolveAssignmentByRanger = async (id, logType, uid, name, resolutionNotes, evidenceFile) => {
  const collectionName = logType === "Incident" ? "incidents" : "monitoring";
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`${logType} document not found.`);
  }

  const data = docSnap.data();
  // Authorization check: Only designated Team Leader can resolve (if assignedTeam exists)
  if (data.assignedTeam?.leader?.uid && data.assignedTeam.leader.uid !== uid) {
    throw new Error("Authorization error: Only the designated Team Leader can resolve this assignment.");
  }

  // Upload evidence photo to Firebase Storage if a DOM File was provided
  let uploadedEvidence = null;
  if (evidenceFile instanceof File) {
    uploadedEvidence = await uploadEvidenceFile(uid, id, evidenceFile);
  } else if (evidenceFile && typeof evidenceFile === "object" && evidenceFile.url) {
    uploadedEvidence = evidenceFile;
  }

  return updateLogWorkflowStatus(id, logType, LOG_STATUS.RESOLVED, uid, name, resolutionNotes, uploadedEvidence);
};

