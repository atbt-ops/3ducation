import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./db.js";
import { readState, saveItem, getOwner } from "./features/store.js";
import * as THREE from "three";
import { runSimulation, validateCode } from "./features/simulation-language.js";
import { compile } from "./lib/expr.js";
const subjects = [
  "Physics",
  "Chemistry",
  "Biology",
  "Math",
  "Mathematics",
  "Earth Science",
  "Astronomy",
];
const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
export function validateSubmission(data) {
  const type = ["formula", "code", "resource", "module"].includes(data.type)
    ? data.type
    : "resource";
  const result = {
    type,
    name: text(data.name, 100),
    description: text(data.description, 2000),
    subject: data.subject,
    gradeMin: Number(data.gradeMin) || 6,
    gradeMax: Number(data.gradeMax) || 12,
    formula: type === "formula" ? text(data.formula, 300) : "",
    code: ["code", "module"].includes(type) ? text(data.code, 20000) : "",
    content: type === "resource" ? text(data.content, 12000) : "",
    resourceUrl: text(data.resourceUrl, 1000),
    image: typeof data.image === "string" ? data.image : "",
    quiz: [],
  };
  if (result.name.length < 3 || result.description.length < 20)
    throw new Error("Add a title (3+ characters) and description (20+ characters).");
  if (!subjects.includes(result.subject)) throw new Error("Choose a subject.");
  if (result.gradeMin < 1 || result.gradeMax > 12 || result.gradeMin > result.gradeMax)
    throw new Error("Choose a valid class range, 1–12.");
  if (result.resourceUrl) {
    const u = new URL(result.resourceUrl);
    if (u.protocol !== "https:") throw new Error("Resource links must use HTTPS.");
  }
  if (
    (result.image && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(result.image)) ||
    result.image.length > 180000
  )
    throw new Error("Use a JPG, PNG or WebP image under the image limit.");
  if (type === "code") {
    validateCode(result.code);
    const simulation = runSimulation(THREE, new THREE.Scene(), result.code);
    try {
      simulation.tick(0, 0);
      simulation.tick(0.016, 1);
    } finally {
      simulation.dispose();
    }
  }
  if (type === "formula") compile(result.formula, ["x", "y", "k"]);
  if (type === "resource" && result.content.length < 30)
    throw new Error("Add at least 30 characters of learning content.");
  if (Array.isArray(data.quiz))
    result.quiz = data.quiz.slice(0, 5).map((q) => {
      if (
        !q ||
        typeof q.q !== "string" ||
        !Array.isArray(q.choices) ||
        q.choices.length < 2 ||
        q.choices.length > 4 ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer >= q.choices.length
      )
        throw new Error("Invalid quiz question.");
      return {
        q: text(q.q, 300),
        choices: q.choices.map((c) => text(c, 200)),
        answer: q.answer,
        explain: text(q.explain, 500),
      };
    });
  return result;
}
export async function createSubmission(user, data, id) {
  if (!user || getOwner() !== user.uid)
    throw new Error("Sign in to submit. You can save a draft without an account.");
  const payload = validateSubmission(data);
  id = id || `${user.uid}__${crypto.randomUUID()}`;
  const ok = saveItem("drafts", id, {
    ...payload,
    authorUid: user.uid,
    authorName: text(user.displayName, 80) || "Learner",
    status: "queued",
    id,
    queuedAt: Date.now(),
  });
  if (!ok)
    throw new Error(
      "Browser storage is unavailable; your contribution could not be queued. Export or free storage and try again."
    );
  void flushSubmissions(user);
  return id;
}
let flushing = false;
export async function flushSubmissions(user) {
  if (flushing || !db || !user || !navigator.onLine || getOwner() !== user.uid) return;
  flushing = true;
  try {
    for (const [id, item] of Object.entries(readState().drafts)) {
      if (item.status !== "queued" || item.authorUid !== user.uid) continue;
      try {
        const data = validateSubmission(item);
        const remoteStatus = await runTransaction(db, async (tx) => {
          const ref = doc(db, "submissions", id),
            snap = await tx.get(ref);
          if (snap.exists() && snap.data().status !== "changes_requested")
            return snap.data().status;
          const payload = {
            ...data,
            authorUid: user.uid,
            authorName: item.authorName,
            status: "pending",
            updatedAt: serverTimestamp(),
          };
          if (!snap.exists()) payload.createdAt = serverTimestamp();
          else {
            payload.createdAt = snap.data().createdAt;
            payload.reviewNote = snap.data().reviewNote || "";
          }
          tx.set(ref, payload);
          return "pending";
        });
        if (getOwner() !== user.uid) break;
        saveItem("drafts", id, { ...item, status: remoteStatus, lastError: "" });
        dispatchEvent(new Event("spark-contributions"));
      } catch (err) {
        if (getOwner() === user.uid)
          saveItem("drafts", id, {
            ...item,
            lastError:
              err.code === "permission-denied"
                ? "Permission denied. Check the deployed Firestore rules."
                : "Waiting for cloud connection; will retry.",
          });
      }
    }
  } finally {
    flushing = false;
  }
}
function requireCloud() {
  if (!db) throw new Error("Community cloud is not configured. Drafts and previews work locally.");
  if (!navigator.onLine)
    throw new Error("Offline. Previously opened approved contributions remain available.");
}
function cacheRead() {
  try {
    return JSON.parse(localStorage.getItem("sparklab.public.v2") || "{}");
  } catch {
    return {};
  }
}
function cachePut(items) {
  try {
    const cache = cacheRead();
    for (const s of items) if (s.status === "approved") cache[s.id] = s;
    localStorage.setItem(
      "sparklab.public.v2",
      JSON.stringify(Object.fromEntries(Object.entries(cache).slice(-60)))
    );
  } catch {
    dispatchEvent(new Event("spark-storage-error"));
  }
}
export async function listMySubmissions(uid) {
  if (!db || !navigator.onLine)
    return Object.values(readState().drafts).filter((s) => s.authorUid === uid);
  const snap = await getDocs(query(collection(db, "submissions"), where("authorUid", "==", uid)));
  const byId = new Map(Object.entries(readState().drafts).filter(([, s]) => s.authorUid === uid));
  snap.docs.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() }));
  return [...byId.values()];
}
export async function listAllSubmissions() {
  requireCloud();
  const snap = await getDocs(collection(db, "submissions"));
  return snap.docs
    .filter((d) => /^[\w-]{1,160}$/.test(d.id))
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
export async function getSubmission(id) {
  if (!/^[\w-]{1,200}$/.test(id)) return null;
  try {
    requireCloud();
    const snap = await getDoc(doc(db, "submissions", id));
    const item = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    if (item) cachePut([item]);
    return item;
  } catch (err) {
    const cached = cacheRead()[id];
    if (cached) return cached;
    throw err;
  }
}
export async function listApprovedFormulas() {
  try {
    requireCloud();
    const snap = await getDocs(
      query(collection(db, "submissions"), where("status", "==", "approved"))
    );
    const items = snap.docs
      .filter((d) => /^[\w-]{1,160}$/.test(d.id))
      .map((d) => ({ id: d.id, ...d.data() }));
    try {
      localStorage.removeItem("sparklab.public.v2");
    } catch {
      /* cache unavailable */
    }
    cachePut(items);
    return items;
  } catch (err) {
    const cached = Object.values(cacheRead());
    if (cached.length) return cached;
    throw err;
  }
}
export async function reviewSubmission(id, status, note) {
  requireCloud();
  if (!["approved", "rejected", "changes_requested"].includes(status))
    throw new Error("Invalid decision.");
  if (status === "changes_requested" && !note.trim())
    throw new Error("Explain what the contributor should change.");
  return runTransaction(db, async (tx) => {
    const ref = doc(db, "submissions", id),
      snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== "pending")
      throw new Error("This submission has already been reviewed. Reload the queue.");
    tx.update(ref, { status, reviewNote: text(note, 500), reviewedAt: serverTimestamp() });
  });
}
