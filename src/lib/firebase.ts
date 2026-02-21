import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GithubAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "engineering-report-e4af5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization to avoid SSR issues
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let githubProvider: GithubAuthProvider | undefined;

function getFirebaseApp() {
  if (typeof window === "undefined") {
    return undefined;
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

export function getFirebaseAuth(): Auth | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return undefined;
  if (!auth) {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseDb(): Firestore | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return undefined;
  if (!db) {
    db = getFirestore(firebaseApp);
  }
  return db;
}

export function getGithubProvider(): GithubAuthProvider {
  if (!githubProvider) {
    githubProvider = new GithubAuthProvider();
    // Request additional GitHub scopes for repo access
    githubProvider.addScope("read:user");
    githubProvider.addScope("repo");
  }
  return githubProvider;
}
