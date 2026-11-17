import { doc, runTransaction } from "firebase/firestore";
import { db } from "./db.js";
import {
  readState,
  writeState,
  mergeStates,
  subscribe,
  setOwner,
  getOwner,
} from "./features/store.js";
let uid = null,
  unsubscribe = null,
  timer = null,
  generation = 0,
  running = false,
  applying = false;
export let syncStatus = "Local only";
function status(text) {
  syncStatus = text;
  dispatchEvent(new CustomEvent("spark-sync", { detail: text }));
}
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(flush, 600);
}
export async function flush() {
  if (!uid || !db || running) return;
  if (!navigator.onLine) {
    status("Offline · changes saved on this device");
    return;
  }
  const account = uid,
    token = generation;
  running = true;
  status("Syncing…");
  try {
    const local = readState();
    const merged = await runTransaction(db, async (tx) => {
      const ref = doc(db, "progress", account),
        snap = await tx.get(ref);
      const raw = snap.exists() ? snap.data() : {};
      const remote = raw.version === 2 ? raw : { progress: raw };
      const next = mergeStates({ ...local, drafts: {} }, { ...remote, drafts: {} });
      if (JSON.stringify(next).length > 750000)
        throw new Error(
          "Cloud progress limit reached. Export and remove older saved visualizations."
        );
      tx.set(ref, next);
      return next;
    });
    if (token !== generation || getOwner() !== account) return;
    const current = readState();
    applying = true;
    writeState(mergeStates(current, merged));
    applying = false;
    status("Synced");
    if (current.revision !== local.revision) schedule();
  } catch {
    if (token === generation) status("Cloud unavailable · will retry");
  } finally {
    running = false;
    if (token !== generation && uid) schedule();
  }
}
export function attachSync(account) {
  detachSync();
  uid = account;
  setOwner(account);
  unsubscribe = subscribe(() => {
    if (applying) return;
    status("Changes waiting to sync");
    schedule();
  });
  flush();
}
export function detachSync() {
  generation++;
  uid = null;
  clearTimeout(timer);
  unsubscribe?.();
  unsubscribe = null;
  status("Local only");
}
addEventListener("online", flush);
setInterval(flush, 30000);
