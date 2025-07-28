// Firebase Admin initialization required
// Run using: node scripts/import_seed_data.js
const admin = require("firebase-admin");

// Initialize the app with credentials from environment variables if available,
// or from the default service account location.
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// Make sure you have a `rowy_seed_data.json` file in the root of your project.
const seedData = require("../rowy_seed_data.json");

async function importAll() {
  console.log("Starting data import...");
  for (const [collection, entries] of Object.entries(seedData)) {
    if (Array.isArray(entries)) {
        for (const entry of entries) {
          // Check for existing customer with the same GST to avoid duplicates
          const existingCustomerQuery = await db.collection(collection).where('gst', '==', entry.gst).get();
          if (existingCustomerQuery.empty) {
            await db.collection(collection).add(entry);
          } else {
            console.log(`Skipping duplicate customer with GST: ${entry.gst}`);
          }
        }
        console.log(`Imported ${entries.length} entries (or skipped duplicates) into ${collection}`);
    } else {
        console.warn(`Skipping '${collection}' as it is not an array.`);
    }
  }
}

importAll().then(() => {
  console.log("✅ Import complete.");
  process.exit(0);
}).catch(error => {
  console.error("❌ Error during import:", error);
  process.exit(1);
});
