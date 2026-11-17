import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
const env = await initializeTestEnvironment({
  projectId: "demo-spark-enhanced",
  firestore: { rules: await readFile("firestore.rules", "utf8") },
});
const alice = env.authenticatedContext("alice", { email: "alice@example.test" }).firestore();
const bob = env.authenticatedContext("bob", { email: "bob@example.test" }).firestore();
const admin = env.authenticatedContext("moderator", { admin: true }).firestore();
const guest = env.unauthenticatedContext().firestore();
const payload = () => ({
  type: "resource",
  name: "Pendulum study",
  description: "Measure the period of a pendulum at different lengths.",
  subject: "Physics",
  gradeMin: 6,
  gradeMax: 12,
  formula: "",
  code: "",
  content: "Change the string length, time ten swings, and compare the average period.",
  resourceUrl: "",
  image: "",
  quiz: [],
  authorUid: "alice",
  authorName: "Alice",
  status: "pending",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
let checks = 0;
async function allowed(p) {
  await assertSucceeds(p);
  checks++;
}
async function denied(p) {
  await assertFails(p);
  checks++;
}
try {
  await env.clearFirestore();
  const progress = {
    version: 2,
    revision: 1,
    resetAt: 0,
    progress: {},
    saved: {},
    preferences: {},
    drafts: {},
  };
  await allowed(setDoc(doc(alice, "progress", "alice"), progress));
  await allowed(getDoc(doc(alice, "progress", "alice")));
  await denied(getDoc(doc(bob, "progress", "alice")));
  await denied(setDoc(doc(bob, "progress", "alice"), progress));
  await denied(getDoc(doc(guest, "progress", "alice")));
  await denied(setDoc(doc(alice, "progress", "alice"), { version: 2, progress: "bad" }));
  await denied(setDoc(doc(alice, "submissions", 'alice__bad"id'), payload()));
  await allowed(getDoc(doc(alice, "submissions", "alice__one"))); // retry-safe transaction first read
  await allowed(setDoc(doc(alice, "submissions", "alice__one"), payload()));
  await denied(
    setDoc(doc(alice, "submissions", "alice__approved"), { ...payload(), status: "approved" })
  );
  await denied(
    setDoc(doc(alice, "submissions", "alice__impersonation"), { ...payload(), authorUid: "bob" })
  );
  await denied(
    setDoc(doc(alice, "submissions", "alice__email"), {
      ...payload(),
      authorEmail: "private@example.test",
    })
  );
  await denied(
    setDoc(doc(alice, "submissions", "alice__url"), {
      ...payload(),
      resourceUrl: "javascript:alert(1)",
    })
  );
  await denied(
    setDoc(doc(alice, "submissions", "alice__oversize"), {
      ...payload(),
      content: "x".repeat(12001),
    })
  );
  await denied(getDoc(doc(bob, "submissions", "alice__one")));
  await denied(getDoc(doc(guest, "submissions", "alice__one")));
  await allowed(
    getDocs(query(collection(alice, "submissions"), where("authorUid", "==", "alice")))
  );
  await denied(updateDoc(doc(alice, "submissions", "alice__one"), { status: "approved" }));
  await denied(updateDoc(doc(admin, "submissions", "alice__one"), { authorUid: "moderator" }));
  await allowed(
    updateDoc(doc(admin, "submissions", "alice__one"), {
      status: "changes_requested",
      reviewNote: "Add units.",
      reviewedAt: serverTimestamp(),
    })
  );
  const original = (await getDoc(doc(alice, "submissions", "alice__one"))).data();
  const revision = {
    ...payload(),
    content: "Time the oscillations in seconds; measure string length in metres.",
    createdAt: original.createdAt,
    reviewNote: original.reviewNote,
  };
  await denied(setDoc(doc(bob, "submissions", "alice__one"), revision));
  await allowed(setDoc(doc(alice, "submissions", "alice__one"), revision));
  await allowed(
    updateDoc(doc(admin, "submissions", "alice__one"), {
      status: "approved",
      reviewNote: "Reviewed.",
      reviewedAt: serverTimestamp(),
    })
  );
  await allowed(getDoc(doc(guest, "submissions", "alice__one")));
  await allowed(
    getDocs(query(collection(guest, "submissions"), where("status", "==", "approved")))
  );
  await denied(getDocs(collection(guest, "submissions")));
  await denied(
    updateDoc(doc(alice, "submissions", "alice__one"), {
      content: "Silently changed after approval",
    })
  );
  assert.equal((await getDoc(doc(guest, "submissions", "alice__one"))).data().authorUid, "alice");
  console.log(`${checks} Firestore authorization and moderation checks passed.`);
} finally {
  await env.cleanup();
}
