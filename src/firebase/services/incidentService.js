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
  runTransaction,
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
 * Creates a new incident report, uploads all evidence files, and saves metadata to Firestore.
 * 
 * @param {object} incidentData - Incident report data (category, incidentType, location, dateTime, description, severity, reporter details)
 * @param {Array<File>} files - Evidence files to upload
 * @param {function} onFileProgress - Callback tracking progress of file uploads: (fileIndex, progress)
 * @returns {Promise<string>} - Resolves to the created Incident ID
 */
export const createIncidentReport = async (incidentData, files, onFileProgress) => {
  // 1. Create a doc reference to get the ID beforehand
  const incidentsRef = collection(db, "incidents");
  const newIncidentDoc = doc(incidentsRef);
  const incidentId = newIncidentDoc.id;
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

  // 3. Save incident document to Firestore
  const finalDocData = {
    ...incidentData,
    id: incidentId,
    evidence: uploadedEvidence,
    status: "Submitted", // Initial status
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
 * Prevents race conditions where two staff members review the same report simultaneously.
 *
 * @param {string} incidentId - Unique Firestore document ID
 * @param {string} status     - New status value ('Resolved' | 'Dismissed')
 * @param {string} reviewerUid - UID of the staff performing the review
 * @param {string} remarks    - Optional reviewer remarks
 * @returns {Promise<void>}
 */
export const reviewIncidentAtomic = async (incidentId, status, reviewerUid, remarks) => {
  const docRef = doc(db, "incidents", incidentId);

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists()) {
      throw new Error("Incident document does not exist.");
    }

    const data = docSnap.data();
    // If the status is already resolved or dismissed, throw concurrency error
    if (data.status === "Resolved" || data.status === "Dismissed") {
      throw new Error("REPORT_ALREADY_REVIEWED");
    }

    const updatePayload = {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: reviewerUid,
      reviewerRemarks: remarks || ""
    };

    transaction.update(docRef, updatePayload);
  });

  // Cleanup storage if dismissed
  if (status === "Dismissed") {
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
        // Clear the evidence array after deletion
        await updateDoc(docRef, { evidence: [] });
      }
    } catch (err) {
      console.error("Error cleaning up evidence for dismissed report:", err);
    }
  }
};

/**
 * Admin override for incident status. 
 * Allows admins to forcefully change status and leave an audit trail.
 */
export const adminOverrideIncident = async (incidentId, status, adminUid, reason) => {
  const docRef = doc(db, "incidents", incidentId);
  const updatePayload = {
    status,
    updatedAt: serverTimestamp(),
    adminOverride: {
      adminUid,
      reason,
      timestamp: serverTimestamp()
    }
  };
  return updateDoc(docRef, updatePayload);
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
 * Resolves an assignment by a ranger.
 */
export const resolveAssignmentByRanger = async (id, logType, uid, name, resolutionNotes, evidenceFile) => {
  return updateLogWorkflowStatus(id, logType, LOG_STATUS.RESOLVED, uid, name, resolutionNotes, evidenceFile);
};

