// Community instrument submissions — stored in Firestore, never executed.
// A submission is plain text (name/description/code) that only becomes a
// live module once an admin reviews it and a maintainer merges it into
// src/modules/ through a normal commit. See README "Community submissions".
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./db.js";

const COL = "submissions";

export async function createSubmission(user, data) {
  const payload = {
    authorUid: user.uid,
    authorEmail: user.email || "",
    authorName: user.displayName || "",
    name: data.name.trim(),
    subject: data.subject,
    gradeMin: data.gradeMin,
    gradeMax: data.gradeMax,
    description: data.description.trim(),
    code: data.code,
    status: "pending",
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

export async function listMySubmissions(uid) {
  const q = query(collection(db, COL), where("authorUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function listAllSubmissions() {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function reviewSubmission(id, status, note) {
  return updateDoc(doc(db, COL, id), {
    status,
    reviewNote: note || "",
    reviewedAt: serverTimestamp(),
  });
}
