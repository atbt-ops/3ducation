import { readState, mutate, subscribe, writeState } from "./features/store.js";
export const progress = {
  all: () => readState().progress,
  for: (id) => readState().progress[id] || { visited: false, quizBest: 0, quizCount: 0 },
  markVisited(id) {
    mutate((s) => {
      s.progress[id] = { ...s.progress[id], visited: true, visitedAt: Date.now() };
    });
  },
  complete(id) {
    mutate((s) => {
      s.progress[id] = {
        ...s.progress[id],
        visited: true,
        completed: true,
        completedAt: Date.now(),
      };
    });
  },
  recordQuiz(id, correct, total) {
    if (
      !Number.isInteger(correct) ||
      !Number.isInteger(total) ||
      total < 1 ||
      correct < 0 ||
      correct > total
    )
      return;
    mutate((s) => {
      const e = s.progress[id] || {};
      const better = correct / total >= (e.quizBest || 0) / (e.quizCount || 1);
      s.progress[id] = {
        ...e,
        visited: true,
        quizAt: Date.now(),
        quizBest: better ? correct : e.quizBest,
        quizCount: better ? total : e.quizCount,
        completed: e.completed || correct === total,
        completedAt: correct === total ? Date.now() : e.completedAt || 0,
      };
    });
  },
  reset() {
    mutate((s) => {
      s.progress = {};
      s.resetAt = Date.now();
    });
  },
  replaceAll(data) {
    const s = readState();
    s.progress = data;
    writeState(s);
  },
  subscribe: (fn) => subscribe((s) => fn(s.progress)),
  recent(ids, limit = 6) {
    const d = this.all();
    return ids
      .filter((id) => d[id]?.visitedAt)
      .sort((a, b) => d[b].visitedAt - d[a].visitedAt)
      .slice(0, limit);
  },
  summary(ids) {
    const d = this.all();
    return {
      visited: ids.filter((id) => d[id]?.visited).length,
      mastered: ids.filter((id) => d[id]?.quizCount && d[id].quizBest === d[id].quizCount).length,
      total: ids.length,
    };
  },
};
