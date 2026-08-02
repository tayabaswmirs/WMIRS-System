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
  runTransaction,
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { db, storage } from "../firebase";

/**
 * Uploads a single monitoring file to Firebase Storage.
 */
export const uploadMonitoringFile = (uid, logId, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, `users/${uid}/monitoring/${logId}/${uniqueFilename}`);
    
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
 * Creates a new monitoring log and uploads associated evidence/photo attachments.
 */
export const createMonitoringLog = async (logData, files, onFileProgress) => {
  const monitoringRef = collection(db, "monitoring");
  const newLogDoc = doc(monitoringRef);
  const logId = newLogDoc.id;
  const uid = logData.reporter.uid;

  const uploadedEvidence = [];

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadMonitoringFile(uid, logId, file, (progress) => {
        if (onFileProgress) {
          onFileProgress(i, progress);
        }
      });
      uploadedEvidence.push(result);
    }
  }

  const finalDocData = {
    ...logData,
    id: logId,
    evidence: uploadedEvidence,
    status: "Submitted",
    createdAt: serverTimestamp()
  };

  await setDoc(newLogDoc, finalDocData);
  return logId;
};

/**
 * Subscribes to real-time monitoring logs submitted by a specific user.
 */
export const subscribeToReporterMonitoring = (uid, callback) => {
  const q = query(
    collection(db, "monitoring"),
    where("reporter.uid", "==", uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      // Sort client-side by createdAt descending
      logs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      callback(logs);
    },
    (error) => {
      console.error("Error subscribing to reporter monitoring:", error);
    }
  );
};

/**
 * Subscribes to monitoring logs filtered by a specific category (for Staff workspace).
 */
export const subscribeToCategoryMonitoring = (category, callback) => {
  const q = query(
    collection(db, "monitoring"),
    where("category", "==", category)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      // Sort client-side by createdAt descending
      logs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      callback(logs);
    },
    (error) => {
      console.error("Error subscribing to category monitoring:", error);
    }
  );
};

/**
 * Subscribes to all real-time monitoring logs in the system (for Admin review).
 */
export const subscribeToAllMonitoring = (callback) => {
  const q = query(
    collection(db, "monitoring"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      callback(logs);
    },
    (error) => {
      console.error("Error subscribing to all monitoring:", error);
    }
  );
};

/**
 * Updates the verification status of a monitoring log, logging audit details.
 */
export const updateMonitoringStatus = async (logId, status, adminUid, adminRemarks) => {
  const docRef = doc(db, "monitoring", logId);
  const updatePayload = {
    status,
    adminRemarks: adminRemarks || "",
    updatedAt: serverTimestamp(),
    updatedBy: adminUid
  };

  return updateDoc(docRef, updatePayload);
};

/**
 * Atomically updates the status of a monitoring log.
 * Prevents race conditions where two staff members review the same log simultaneously.
 */
export const reviewMonitoringAtomic = async (logId, status, reviewerUid, remarks) => {
  const docRef = doc(db, "monitoring", logId);

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists()) {
      throw new Error("Monitoring document does not exist.");
    }

    const data = docSnap.data();
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
};

/**
 * Admin override for monitoring status.
 */
export const adminOverrideMonitoring = async (logId, status, adminUid, reason) => {
  const docRef = doc(db, "monitoring", logId);
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
 * Permanently deletes a monitoring log and its associated evidence from Storage.
 */
export const deleteMonitoringLog = async (logId) => {
  const docRef = doc(db, "monitoring", logId);
  
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
    console.error("Error cleaning up evidence for deleted log:", err);
  }
  
  return deleteDoc(docRef);
};
