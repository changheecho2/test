import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isBrowser = typeof window !== "undefined";

function getFirebaseApp() {
  if (!isBrowser) return null;
  if (!firebaseConfig.apiKey) return null;
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getAuthClient() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getDbClient() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function getFunctionsClient() {
  const app = getFirebaseApp();
  return app ? getFunctions(app, process.env.NEXT_PUBLIC_FUNCTIONS_REGION || "asia-northeast3") : null;
}
