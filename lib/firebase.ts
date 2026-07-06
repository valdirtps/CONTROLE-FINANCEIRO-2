import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import config from "../firebase-applet-config.json";

const app = initializeApp(config);
export const db = getFirestore(app, (config as any).firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

// Log database ID for debugging
if (typeof window !== 'undefined') {
  console.log(`[Firebase] Projeto: ${config.projectId}`);
  console.log(`[Firebase] Banco de Dados: ${(config as any).firestoreDatabaseId || '(default)'}`);
}

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence failed: browser not supported.");
    }
  });
}
