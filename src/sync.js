// When signed in, mirrors local progress (visited/quiz scores) to Firestore
// under progress/{uid} so it follows the user across devices. Signed-out
// visitors are unaffected — everything still works from localStorage alone.
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./db.js";
import { progress } from "./state.js";

let unsubscribeLocal = null;
let currentUid = null;

function mergeEntry(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  return {
    visited: !!(local.visited || remote.visited),
    quizCount: local.quizCount || remote.quizCount || 0,
    quizBest: Math.max(local.quizBest || 0, remote.quizBest || 0),
    quizAt: Math.max(local.quizAt || 0, remote.quizAt || 0),
  };
}

function mergeAll(local, remote) {
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const merged = {};
  for (const id of ids) merged[id] = mergeEntry(local[id], remote[id]);
  return merged;
}

/** Call once a user signs in: pulls + merges their cloud progress, then keeps pushing local changes. */
export async function attachSync(uid) {
  currentUid = uid;
  const ref = doc(db, "progress", uid);
  let remote = {};
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) remote = snap.data() || {};
  } catch {
    /* offline or blocked — fall back to local-only for this session */
  }

  const merged = mergeAll(progress.all(), remote);
  progress.replaceAll(merged); // before subscribing, so this doesn't loop back out
  try {
    await setDoc(ref, merged);
  } catch {
    /* will retry on the next local change */
  }

  unsubscribeLocal?.();
  unsubscribeLocal = progress.subscribe((data) => {
    if (currentUid !== uid) return;
    setDoc(doc(db, "progress", uid), data).catch(() => {});
  });
}

/** Call on sign-out: stop pushing local changes to someone else's account. */
export function detachSync() {
  currentUid = null;
  unsubscribeLocal?.();
  unsubscribeLocal = null;
}
