import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseClientStatus = "not-configured" | "configured";

type FirebaseBrowserConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function getFirebaseConfig(): FirebaseBrowserConfig | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  if (
    [
      config.apiKey,
      config.authDomain,
      config.projectId,
      config.storageBucket,
      config.messagingSenderId,
      config.appId,
    ].some((value) => value.length === 0)
  ) {
    return null;
  }

  return config;
}

export function getFirebaseClientStatus(): FirebaseClientStatus {
  return getFirebaseConfig() ? "configured" : "not-configured";
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseConfig();

  if (!config) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();

  return app ? getFirestore(app) : null;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();

  return app ? getAuth(app) : null;
}

export async function ensureFirebaseAuth(): Promise<User | null> {
  const auth = getFirebaseAuth();

  if (!auth) {
    return null;
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);

  return credential.user;
}
