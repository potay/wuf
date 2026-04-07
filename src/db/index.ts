import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Running locally with a service account key file
    initializeApp();
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Running on Cloud Run with Application Default Credentials
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  } else {
    // Fallback: detect from environment (Cloud Run sets this automatically)
    initializeApp();
  }
}

export const db = getFirestore();
