/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: serviceAccountKey.json not found.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const DATA_DIR = path.join(__dirname, 'data');

async function cleanOldHistoricalRecords() {
  console.log("Cleaning up old/corrupted historical records...");
  const monitoringRef = db.collection('monitoring');
  
  const toDeleteDocIds = new Set();

  const queries = [
    monitoringRef.where('submittedBy', '==', 'historical_officer_1'),
    monitoringRef.where('submittedBy', '==', 'historical_officer_2'),
    monitoringRef.where('reporter.uid', '==', 'historical_officer_1'),
    monitoringRef.where('reporter.uid', '==', 'historical_officer_2'),
    monitoringRef.where('isHistorical', '==', true)
  ];

  for (const q of queries) {
    const snap = await q.get();
    snap.forEach((doc) => {
      toDeleteDocIds.add(doc.id);
    });
  }

  console.log(`Found ${toDeleteDocIds.size} legacy historical documents to purge.`);

  const docIdArray = Array.from(toDeleteDocIds);
  const CHUNK_SIZE = 400;

  for (let i = 0; i < docIdArray.length; i += CHUNK_SIZE) {
    const batch = db.batch();
    const chunk = docIdArray.slice(i, i + CHUNK_SIZE);
    chunk.forEach((id) => {
      batch.delete(monitoringRef.doc(id));
    });
    await batch.commit();
    console.log(`Purged batch ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} docs).`);
  }

  console.log("Cleanup completed.");
}

async function seedData() {
  try {
    await cleanOldHistoricalRecords();

    // 1. Seed Users
    const usersPath = path.join(DATA_DIR, 'users_data.json');
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      console.log(`Seeding ${usersData.length} historical user profiles...`);
      for (const user of usersData) {
        await db.collection('users').doc(user.uid).set(user, { merge: true });
      }
      console.log('User profiles successfully seeded.');
    }

    // 2. Load all records to seed
    const bmsPath = path.join(DATA_DIR, 'bms_data.json');
    const compPath = path.join(DATA_DIR, 'compliance_data.json');
    
    const bmsData = fs.existsSync(bmsPath) ? JSON.parse(fs.readFileSync(bmsPath, 'utf8')) : [];
    const compData = fs.existsSync(compPath) ? JSON.parse(fs.readFileSync(compPath, 'utf8')) : [];

    const allRecords = [...bmsData, ...compData];
    console.log(`Seeding ${allRecords.length} total records (${bmsData.length} BMS + ${compData.length} Compliance)...`);

    const BATCH_SIZE = 400;
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = allRecords.slice(i, i + BATCH_SIZE);

      chunk.forEach((record) => {
        const docRef = db.collection('monitoring').doc();
        const eventDate = new Date(record.dateTime || record.date);

        const payload = {
          ...record,
          id: docRef.id,
          createdAt: Timestamp.fromDate(eventDate),
          updatedAt: Timestamp.fromDate(eventDate),
          history: [
            {
              status: "completed",
              timestamp: eventDate.toISOString(),
              by: record.reporter?.uid || "system",
              actorName: record.reporter?.name || "Archival Officer",
              remarks: "Historical log recorded from official 2025 ENRO records."
            }
          ]
        };

        batch.set(docRef, payload);
      });

      await batch.commit();
      console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(allRecords.length / BATCH_SIZE)} (${chunk.length} items).`);
    }

    console.log('All historical records successfully cleaned and seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Error in seeding pipeline:', error);
    process.exit(1);
  }
}

seedData();
