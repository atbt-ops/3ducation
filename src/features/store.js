// Versioned, account-scoped durable state. Never mix one account with another.
const PREFIX = "sparklab.student.v2.";
let owner = "guest";
let memory = null;
const listeners = new Set();
export const blank = () => ({
  version: 2,
  revision: 0,
  resetAt: 0,
  progress: {},
  saved: {},
  preferences: {},
  drafts: {},
});
const record = (v) => v && typeof v === "object" && !Array.isArray(v);
const safeKey = (k) =>
  /^[a-zA-Z0-9_-]{1,160}$/.test(k) && !["__proto__", "constructor", "prototype"].includes(k);
export function validateState(value) {
  const out = blank();
  if (!record(value)) return out;
  out.revision = Number.isFinite(value.revision) ? value.revision : 0;
  out.resetAt = Number.isFinite(value.resetAt) ? value.resetAt : 0;
  for (const group of ["progress", "saved", "preferences", "drafts"]) {
    if (!record(value[group])) continue;
    for (const [key, val] of Object.entries(value[group]).slice(0, 800)) {
      if (!safeKey(key) || !record(val)) continue;
      if (group === "progress") {
        const num = (n) => (Number.isFinite(n) ? Math.max(0, n) : 0);
        out[group][key] = {
          visited: !!val.visited,
          completed: !!val.completed,
          visitedAt: num(val.visitedAt),
          completedAt: num(val.completedAt),
          quizAt: num(val.quizAt),
          quizCount: Math.min(100, num(val.quizCount)),
          quizBest: Math.min(num(val.quizBest), num(val.quizCount), 100),
        };
      } else if (JSON.stringify(val).length <= 240000) out[group][key] = val;
    }
  }
  return out;
}
export function readState() {
  if (memory) return structuredClone(memory);
  try {
    const raw = localStorage.getItem(PREFIX + owner);
    memory = validateState(raw ? JSON.parse(raw) : null);
    if (!raw && owner === "guest") {
      const legacy = JSON.parse(
        localStorage.getItem("sparklab.progress.v1") ||
          localStorage.getItem("3ducation.progress.v1") ||
          "{}"
      );
      memory.progress = validateState({ progress: legacy }).progress;
    }
  } catch {
    memory = blank();
  }
  return structuredClone(memory);
}
export function readGuestState() {
  try {
    return validateState(JSON.parse(localStorage.getItem(PREFIX + "guest") || "{}"));
  } catch {
    return blank();
  }
}
export function writeState(value, notify = true) {
  memory = validateState(value);
  let persisted = true;
  try {
    const serialized = JSON.stringify(memory);
    if (serialized.length > 4000000) throw new Error("Storage limit");
    localStorage.setItem(PREFIX + owner, serialized);
  } catch {
    persisted = false;
    globalThis.dispatchEvent?.(new CustomEvent("spark-storage-error"));
  }
  if (notify) listeners.forEach((fn) => fn(readState()));
  return persisted;
}
export function mutate(fn) {
  const s = readState();
  fn(s);
  s.revision = Math.max(Date.now(), s.revision + 1);
  return writeState(s);
}
export function setOwner(uid) {
  owner = uid || "guest";
  memory = null;
  listeners.forEach((fn) => fn(readState()));
}
export const getOwner = () => owner;
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export function saveItem(group, id, value) {
  return mutate((s) => {
    s[group][id] = { ...value, updatedAt: Date.now() };
  });
}
export function removeItem(group, id) {
  return saveItem(group, id, { deleted: true });
}
export function mergeStates(a, b) {
  a = validateState(a);
  b = validateState(b);
  const result = blank();
  result.resetAt = Math.max(a.resetAt, b.resetAt);
  result.revision = Math.max(a.revision, b.revision);
  for (const id of new Set([...Object.keys(a.progress), ...Object.keys(b.progress)])) {
    const x = a.progress[id] || {};
    const y = b.progress[id] || {};
    if (
      Math.max(
        x.visitedAt || 0,
        y.visitedAt || 0,
        x.quizAt || 0,
        y.quizAt || 0,
        x.completedAt || 0,
        y.completedAt || 0
      ) <= result.resetAt
    )
      continue;
    const valid = (v) =>
      Math.max(v.visitedAt || 0, v.quizAt || 0, v.completedAt || 0) > result.resetAt ? v : {};
    const l = valid(x),
      r = valid(y);
    const best =
      (l.quizBest || 0) / (l.quizCount || 1) >= (r.quizBest || 0) / (r.quizCount || 1) ? l : r;
    result.progress[id] = {
      visited: !!(l.visited || r.visited),
      completed: !!(l.completed || r.completed),
      visitedAt: Math.max(l.visitedAt || 0, r.visitedAt || 0),
      completedAt: Math.max(l.completedAt || 0, r.completedAt || 0),
      quizAt: Math.max(l.quizAt || 0, r.quizAt || 0),
      quizBest: best.quizBest || 0,
      quizCount: best.quizCount || 0,
    };
  }
  for (const group of ["saved", "preferences", "drafts"])
    for (const id of new Set([...Object.keys(a[group]), ...Object.keys(b[group])])) {
      const x = a[group][id],
        y = b[group][id];
      // Deterministic tie break also makes equal-timestamp offline edits converge.
      result[group][id] = !x
        ? y
        : !y
          ? x
          : (x.updatedAt || 0) === (y.updatedAt || 0)
            ? JSON.stringify(x) > JSON.stringify(y)
              ? x
              : y
            : (x.updatedAt || 0) > (y.updatedAt || 0)
              ? x
              : y;
    }
  return result;
}
if (globalThis.addEventListener)
  addEventListener("storage", (e) => {
    if (e.key !== PREFIX + owner || !e.newValue) return;
    try {
      const merged = mergeStates(readState(), JSON.parse(e.newValue));
      memory = null;
      writeState(merged);
    } catch {
      /* malformed external edit */
    }
  });
