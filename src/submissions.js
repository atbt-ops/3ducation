// Community instrument submissions — stored in Firestore.
//
// Two kinds:
//  - "formula": just data (a math expression string). Rendered through the
//    same safe expr.js evaluator Surface studio uses. Nothing here is ever
//    eval'd or executed as code, so an approved one can go live immediately.
//  - "code": free-text module code. Never executed by this app. A maintainer
//    reads it, and only a real git commit (see README "Community submissions")
//    ever makes it live.
import {
  addDoc,
  collection,
  doc,
  getDoc,
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
    type: data.type === "formula" ? "formula" : "code",
    name: data.name.trim(),
    subject: data.subject,
    gradeMin: data.gradeMin,
    gradeMax: data.gradeMax,
    description: data.description.trim(),
    formula: data.type === "formula" ? data.formula.trim() : "",
    code: data.type === "code" ? data.code : "",
    quiz: data.type === "formula" && Array.isArray(data.quiz) ? data.quiz : [],
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

/** A single submission, subject to firestore.rules (public once approved, else author/admin only). */
export async function getSubmission(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Approved, no-code formula instruments — publicly readable, shown at #/community. */
export async function listApprovedFormulas() {
  const q = query(
    collection(db, COL),
    where("status", "==", "approved"),
    where("type", "==", "formula")
  );
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
