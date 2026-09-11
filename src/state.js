// Per-visitor progress, stored locally. No account, no server.
const KEY = "3ducation.progress.v1";

const listeners = new Set();

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / storage disabled — progress just won't persist */
  }
  listeners.forEach((fn) => fn(data));
}

export const progress = {
  all() {
    return read();
  },
  for(moduleId) {
    return read()[moduleId] || { visited: false, quizBest: 0, quizCount: 0 };
  },
  markVisited(moduleId) {
    const data = read();
    const entry = data[moduleId] || {};
    entry.visited = true;
    entry.visitedAt = Date.now();
    data[moduleId] = entry;
    write(data);
  },
  recordQuiz(moduleId, correct, total) {
    const data = read();
    const entry = data[moduleId] || {};
    entry.visited = true;
    entry.quizCount = total;
    entry.quizBest = Math.max(entry.quizBest || 0, correct);
    entry.quizAt = Date.now();
    data[moduleId] = entry;
    write(data);
  },
  reset() {
    write({});
  },
  /** Wholesale replace (used by sync.js when merging in a signed-in account's data). */
  replaceAll(data) {
    write(data || {});
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** Module ids with an entry in `moduleIds`, most recently visited first — for a "continue exploring" row. */
  recent(moduleIds, limit = 6) {
    const data = read();
    return moduleIds
      .filter((id) => data[id]?.visitedAt)
      .sort((a, b) => data[b].visitedAt - data[a].visitedAt)
      .slice(0, limit);
  },
  summary(moduleIds) {
    const data = read();
    let visited = 0;
    let mastered = 0;
    for (const id of moduleIds) {
      const e = data[id];
      if (!e) continue;
      if (e.visited) visited++;
      if (e.quizCount && e.quizBest === e.quizCount) mastered++;
    }
    return { visited, mastered, total: moduleIds.length };
  },
};
