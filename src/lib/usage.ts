import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const FREE_LIMIT = 5;
const USAGE_COLLECTION = "usage";

export type UsageData = {
  count: number;
  limit: number;
};

function getStartOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Check whether the stored resetAt has passed, meaning the counter should reset.
 */
function shouldReset(resetAt: Timestamp): boolean {
  return resetAt.toDate() <= new Date();
}

/**
 * Retrieve current usage for a user. Resets the counter if the month has rolled over.
 */
export async function getUsage(userId: string): Promise<UsageData> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore not available; returning default usage");
    return { count: 0, limit: FREE_LIMIT };
  }

  const ref = doc(db, USAGE_COLLECTION, userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { count: 0, limit: FREE_LIMIT };
  }

  const data = snap.data();
  const resetAt = data.resetAt as Timestamp | undefined;

  // If the reset date has passed, reset the counter
  if (resetAt && shouldReset(resetAt)) {
    await setDoc(ref, {
      count: 0,
      resetAt: Timestamp.fromDate(getStartOfNextMonth()),
    });
    return { count: 0, limit: FREE_LIMIT };
  }

  return { count: (data.count as number) ?? 0, limit: FREE_LIMIT };
}

/**
 * Increment the analysis counter for a user. Creates the document if it doesn't exist.
 */
export async function incrementUsage(userId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore not available; skipping usage increment");
    return;
  }

  const ref = doc(db, USAGE_COLLECTION, userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      count: 1,
      resetAt: Timestamp.fromDate(getStartOfNextMonth()),
    });
    return;
  }

  const data = snap.data();
  const resetAt = data.resetAt as Timestamp | undefined;

  // If the month rolled over, reset and start at 1
  if (resetAt && shouldReset(resetAt)) {
    await setDoc(ref, {
      count: 1,
      resetAt: Timestamp.fromDate(getStartOfNextMonth()),
    });
    return;
  }

  await updateDoc(ref, { count: increment(1) });
}

/**
 * Check whether the user has reached their monthly usage limit.
 */
export async function isAtLimit(userId: string): Promise<boolean> {
  const { count, limit } = await getUsage(userId);
  return count >= limit;
}
