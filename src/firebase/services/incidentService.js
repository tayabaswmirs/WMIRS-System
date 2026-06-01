import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "firebase/storage";
import { db, storage } from "../firebase";

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
  return updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid
  });
};
