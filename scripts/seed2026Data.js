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
  console.error("\n❌ Error: Service account key not found.");
  console.error("Please place your Firebase serviceAccountKey.json in the project root or Downloads folder.\n");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const DATA_DIR = path.join(__dirname, 'data');

/**
 * Intelligent Officer Matcher
 * Maps document signatories to live users if they already have an account.
 * Specifically recognizes "Bless" for Blessbelle Claire A. Durante.
 */
function findMatchingUser(existingUsers, officerKey) {
  for (const user of existingUsers) {
    const normName = (user.name || user.displayName || "").toLowerCase();
    const normEmail = (user.email || "").toLowerCase();

    if (officerKey === 'bless') {
      // Matches "Bless", "Blessbelle", "Bless Durante", or bless in email
      if (normName.includes('bless') || normEmail.includes('bless')) {
        return user;
      }
    } else if (officerKey === 'kevin') {
      if ((normName.includes('kevin') && normName.includes('morales')) || normName.includes('kevin') || normEmail.includes('kevin')) {
        return user;
      }
    } else if (officerKey === 'carlo') {
      if ((normName.includes('carlo') && normName.includes('sabornido')) || normName.includes('carlo') || normEmail.includes('carlo')) {
        return user;
      }
    } else if (officerKey === 'jerdylene') {
      if (normName.includes('jerdylene') || normName.includes('tabi') || normEmail.includes('jerdylene') || normEmail.includes('tabi')) {
        return user;
      }
    } else if (officerKey === 'melvin') {
      if (normName.includes('melvin') || normName.includes('rada') || normEmail.includes('melvin') || normEmail.includes('rada')) {
        return user;
      }
    }
  }
  return null;
}

async function seed2026Data() {
  console.log("\n==================================================");
  console.log("🚀 Starting WMIRS FY 2026 Preseeding Procedure");
  console.log("==================================================\n");

  // 1. Fetch live existing users to avoid account conflicts
  console.log("🔍 Checking existing user profiles in Firestore...");
  const usersSnap = await db.collection('users').get();
  const existingUsers = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
  console.log(`Found ${existingUsers.length} existing user profiles in database.`);

  const matchedBless = findMatchingUser(existingUsers, 'bless');
  const matchedKevin = findMatchingUser(existingUsers, 'kevin');
  const matchedCarlo = findMatchingUser(existingUsers, 'carlo');
  const matchedJerdylene = findMatchingUser(existingUsers, 'jerdylene');
  const matchedMelvin = findMatchingUser(existingUsers, 'melvin');

  console.log("\n👤 Officer Account Linkages:");
  console.log(`- Bless (Blessbelle Durante): ${matchedBless ? `Linked to existing account: "${matchedBless.name || matchedBless.displayName}" (UID: ${matchedBless.uid})` : 'No existing account found. Will register placeholder.'}`);
  console.log(`- Kevin Morales:              ${matchedKevin ? `Linked to existing account: "${matchedKevin.name || matchedKevin.displayName}" (UID: ${matchedKevin.uid})` : 'No existing account found. Will register placeholder.'}`);
  console.log(`- Carlo Sabornido:            ${matchedCarlo ? `Linked to existing account: "${matchedCarlo.name || matchedCarlo.displayName}" (UID: ${matchedCarlo.uid})` : 'No existing account found. Will register placeholder.'}`);
  console.log(`- Jerdylene Tabi:             ${matchedJerdylene ? `Linked to existing account: "${matchedJerdylene.name || matchedJerdylene.displayName}" (UID: ${matchedJerdylene.uid})` : 'No existing account found. Will register placeholder.'}`);
  console.log(`- Melvin Rada:                ${matchedMelvin ? `Linked to existing account: "${matchedMelvin.name || matchedMelvin.displayName}" (UID: ${matchedMelvin.uid})` : 'No existing account found. Will register placeholder.'}`);

  // 2. Register fallback profiles only for officers who DO NOT have an account
  const users2026Path = path.join(DATA_DIR, 'users_2026.json');
  if (fs.existsSync(users2026Path)) {
    const usersToRegister = JSON.parse(fs.readFileSync(users2026Path, 'utf8'));
    for (const u of usersToRegister) {
      const isAlreadyExisting = existingUsers.some(ex => ex.uid === u.uid);
      if (!isAlreadyExisting) {
        // If Bless already has an account under a different UID, don't create dummy
        if (u.uid === 'officer_blessbelle_durante' && matchedBless) continue;
        if (u.uid === 'officer_kevin_morales' && matchedKevin) continue;
        if (u.uid === 'officer_carlo_sabornido' && matchedCarlo) continue;
        if (u.uid === 'officer_jerdylene_tabi' && matchedJerdylene) continue;
        if (u.uid === 'officer_melvin_rada' && matchedMelvin) continue;

        await db.collection('users').doc(u.uid).set(u, { merge: true });
        console.log(`Created fallback officer profile for: ${u.name}`);
      }
    }
  }

  // Helper to re-map author/workflow if a live officer account was matched
  function remapRecordSignatories(record) {
    const updated = { ...record };

    // Remap reporter
    if (updated.reporter) {
      if (updated.reporter.name.toLowerCase().includes('bless') && matchedBless) {
        updated.reporter = {
          uid: matchedBless.uid,
          name: matchedBless.name || matchedBless.displayName || "Bless",
          email: matchedBless.email || updated.reporter.email,
          role: matchedBless.role || "envi_enforcer",
          designation: "AAIII - Environmental Enforcer"
        };
      } else if (updated.reporter.name.toLowerCase().includes('kevin') && matchedKevin) {
        updated.reporter = {
          uid: matchedKevin.uid,
          name: matchedKevin.name || matchedKevin.displayName || "Kevin King F. Morales",
          email: matchedKevin.email || updated.reporter.email,
          role: matchedKevin.role || "envi_enforcer",
          designation: "AAIII - Environmental Enforcer"
        };
      }
    }

    // Remap workflowHistory & history
    if (Array.isArray(updated.workflowHistory)) {
      updated.workflowHistory = updated.workflowHistory.map(step => {
        const s = { ...step };
        if (s.actorName.toLowerCase().includes('bless') && matchedBless) {
          s.by = matchedBless.uid;
          s.actorName = matchedBless.name || matchedBless.displayName || "Bless";
        } else if (s.actorName.toLowerCase().includes('kevin') && matchedKevin) {
          s.by = matchedKevin.uid;
          s.actorName = matchedKevin.name || matchedKevin.displayName || "Kevin King F. Morales";
        } else if (s.actorName.toLowerCase().includes('jerdylene') && matchedJerdylene) {
          s.by = matchedJerdylene.uid;
          s.actorName = matchedJerdylene.name || matchedJerdylene.displayName || "Jerdylene C. Tabi";
        } else if (s.actorName.toLowerCase().includes('melvin') && matchedMelvin) {
          s.by = matchedMelvin.uid;
          s.actorName = matchedMelvin.name || matchedMelvin.displayName || "Melvin C. Rada";
        }
        return s;
      });
      updated.history = updated.workflowHistory;
    }

    // Set accurate Firestore createdAt Timestamp
    const eventDate = new Date(updated.dateTime || updated.date);
    updated.createdAt = Timestamp.fromDate(eventDate);
    updated.updatedAt = Timestamp.fromDate(eventDate);

    return updated;
  }

  const BATCH_SIZE = 400;

  // 3. Seed Document 1: 74 Waste Incidents
  const incidentsPath = path.join(DATA_DIR, 'incidents_2026.json');
  if (fs.existsSync(incidentsPath)) {
    const rawIncidents = JSON.parse(fs.readFileSync(incidentsPath, 'utf8'));
    console.log(`\n📦 Seeding ${rawIncidents.length} Waste Incidents into 'incidents' collection...`);

    for (let i = 0; i < rawIncidents.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = rawIncidents.slice(i, i + BATCH_SIZE);
      chunk.forEach(rec => {
        const finalRec = remapRecordSignatories(rec);
        const docRef = db.collection('incidents').doc(finalRec.id);
        batch.set(docRef, finalRec, { merge: true });
      });
      await batch.commit();
      console.log(`  ✓ Committed incidents chunk ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} docs)`);
    }
  }

  // 4. Seed Document 2: 82 Citation Tickets
  const citationsPath = path.join(DATA_DIR, 'compliance_2026_citations.json');
  if (fs.existsSync(citationsPath)) {
    const rawCitations = JSON.parse(fs.readFileSync(citationsPath, 'utf8'));
    console.log(`\n📦 Seeding ${rawCitations.length} Citation Tickets into 'monitoring' collection...`);

    for (let i = 0; i < rawCitations.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = rawCitations.slice(i, i + BATCH_SIZE);
      chunk.forEach(rec => {
        const finalRec = remapRecordSignatories(rec);
        const docRef = db.collection('monitoring').doc(finalRec.id);
        batch.set(docRef, finalRec, { merge: true });
      });
      await batch.commit();
      console.log(`  ✓ Committed citations chunk ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} docs)`);
    }
  }

  // 5. Seed Document 3: 486 Warning Notices
  const warningsPath = path.join(DATA_DIR, 'compliance_2026_warnings.json');
  if (fs.existsSync(warningsPath)) {
    const rawWarnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
    console.log(`\n📦 Seeding ${rawWarnings.length} Warning Notices into 'monitoring' collection...`);

    for (let i = 0; i < rawWarnings.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = rawWarnings.slice(i, i + BATCH_SIZE);
      chunk.forEach(rec => {
        const finalRec = remapRecordSignatories(rec);
        const docRef = db.collection('monitoring').doc(finalRec.id);
        batch.set(docRef, finalRec, { merge: true });
      });
      await batch.commit();
      console.log(`  ✓ Committed warnings chunk ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} docs)`);
    }
  }

  console.log("\n==================================================");
  console.log("✅ All FY 2026 Records Successfully Seeded!");
  console.log("==================================================\n");
}

seed2026Data().catch(err => {
  console.error("Seeding execution failed:", err);
  process.exit(1);
});
