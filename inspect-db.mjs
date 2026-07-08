import { initializeApp } from "firebase/app";
import { initializeFirestore, getDocs, collection } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId || "(default)");

const collections = ["debtors", "accounts", "launchTypes", "transactions", "parcelas"];

async function inspect() {
  console.log("=== DB INSPECTION ===");
  for (const colName of collections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`\nCollection: ${colName} (Total: ${snapshot.size} docs)`);
      if (snapshot.size > 0) {
        const uids = new Set();
        let noUidCount = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.userId) {
            uids.add(data.userId);
          } else {
            noUidCount++;
          }
        });
        console.log(`- Unique userIds found:`, Array.from(uids));
        console.log(`- Docs with no userId:`, noUidCount);
        
        // Let's print the first 2 docs for inspection
        console.log(`- Samples (up to 2):`);
        snapshot.docs.slice(0, 2).forEach(doc => {
          console.log(`  Doc ID: ${doc.id} =>`, JSON.stringify(doc.data()));
        });
      }
    } catch (err) {
      console.error(`Error reading ${colName}:`, err.message);
    }
  }
}

inspect().then(() => process.exit(0)).catch(err => {
  console.error("Inspect failed:", err);
  process.exit(1);
});
