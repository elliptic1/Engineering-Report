import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export type AnalysisRecord = {
  id: string;
  userId: string;
  repo: string;
  contributor: string;
  summary: string;
  citations: string[];
  createdAt: Date;
};

const COLLECTION = "analyses";

/**
 * Save an analysis result to Firestore.
 * Called client-side after a successful analysis.
 */
export async function saveAnalysis(params: {
  userId: string;
  repo: string;
  contributor: string;
  summary: string;
  citations: string[];
}): Promise<string | null> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore not available; skipping save.");
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId: params.userId,
      repo: params.repo,
      contributor: params.contributor,
      summary: params.summary,
      citations: params.citations,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to save analysis to Firestore:", err);
    return null;
  }
}

/**
 * Fetch all past analyses for a given user, newest first.
 */
export async function getUserHistory(
  userId: string
): Promise<AnalysisRecord[]> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore not available; returning empty history.");
    return [];
  }

  try {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId as string,
        repo: data.repo as string,
        contributor: data.contributor as string,
        summary: data.summary as string,
        citations: (data.citations ?? []) as string[],
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt),
      };
    });
  } catch (err) {
    console.error("Failed to fetch history from Firestore:", err);
    return [];
  }
}
