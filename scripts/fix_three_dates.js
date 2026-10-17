/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const downloadsPath = 'c:\\Users\\venre\\Downloads\\tayabas-wmirs-firebase-adminsdk-fbsvc-fb4994602a.json';
const serviceAccountPath = fs.existsSync(defaultPath) ? defaultPath : (fs.existsSync(downloadsPath) ? downloadsPath : null);

if (!serviceAccountPath) {
  console.error("Service account key not found.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function fixThree() {
  console.log("Fixing the 3 future dated incidents in Firestore...\n");

  // 1. Lalo (Dec 8 2026 -> Dec 8 2025)
  const laloRef = db.collection('incidents').doc('inc_2026_dumping_lalo_20261208_073');
  const laloSnap = await laloRef.get();
  if (laloSnap.exists) {
    await laloRef.update({
      date: 'December 08, 2025',
      dateTime: '2025-12-08T08:00:00',
      createdAt: Timestamp.fromDate(new Date('2025-12-08T08:00:00')),
      updatedAt: Timestamp.fromDate(new Date('2025-12-08T08:00:00')),
      fiscalYear: 2025
    });
    console.log("✓ Fixed Lalo incident: date updated to December 08, 2025");
  }

  // 2. Lita (Dec 1 2026 -> Dec 1 2025)
  const litaRef = db.collection('incidents').doc('inc_2026_burning_lita_20261201_022');
  const litaSnap = await litaRef.get();
  if (litaSnap.exists) {
    await litaRef.update({
      date: 'December 01, 2025',
      dateTime: '2025-12-01T08:00:00',
      createdAt: Timestamp.fromDate(new Date('2025-12-01T08:00:00')),
      updatedAt: Timestamp.fromDate(new Date('2025-12-01T08:00:00')),
      fiscalYear: 2025
    });
    console.log("✓ Fixed Lita incident: date updated to December 01, 2025");
  }

  // 3. Jaime Clado (Oct 19 2026 typo -> Oct 09 2026)
  const jaimeRef = db.collection('incidents').doc('9681889a-66dc-4840-bad3-f82803514014');
  const jaimeSnap = await jaimeRef.get();
  if (jaimeSnap.exists) {
    await jaimeRef.update({
      date: 'October 09, 2026',
      dateTime: '2026-10-09T10:32:00',
      updatedAt: Timestamp.fromDate(new Date('2026-10-09T10:32:00'))
    });
    console.log("✓ Fixed Jaime Clado incident: date updated to October 09, 2026, 10:32 AM");
  }

  console.log("\nAll 3 incidents are now accurately dated in the past!");
}

fixThree().catch(err => {
  console.error("Error fixing dates:", err);
  process.exit(1);
});
