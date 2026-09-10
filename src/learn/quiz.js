import { progress } from "../state.js";

/**
 * Renders a short check-for-understanding quiz.
 * questions: [{ q, choices: string[], answer: number, explain: string }]
 */
export function mountQuiz(container, moduleId, questions) {
  if (!questions || !questions.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  let i = 0;
  let correct = 0;
  let answered = false;

  const root = document.createElement("div");
  root.className = "quiz";
  root.innerHTML = `
    <div class="quiz-head">
      <span class="section-label">Check yourself</span>
      <span class="quiz-count" aria-live="polite"></span>
    </div>
    <p class="quiz-q" id="${moduleId}-quiz-q"></p>
    <div class="quiz-choices" role="group" aria-labelledby="${moduleId}-quiz-q"></div>
    <p class="quiz-explain" role="status" hidden></p>
    <div class="btn-row">
      <button class="btn primary" data-act="next" type="button" hidden>Next question</button>
      <button class="btn" data-act="restart" type="button" hidden>Try again</button>
    </div>
  `;
  container.replaceChildren(root);

  const qEl = root.querySelector(".quiz-q");
  const choicesEl = root.querySelector(".quiz-choices");
  const explainEl = root.querySelector(".quiz-explain");
  const countEl = root.querySelector(".quiz-count");
  const nextBtn = root.querySelector('[data-act="next"]');
  const restartBtn = root.querySelector('[data-act="restart"]');

  function renderQuestion() {
    answered = false;
    const item = questions[i];
    countEl.textContent = `${i + 1} / ${questions.length}`;
    qEl.textContent = item.q;
    explainEl.hidden = true;
    nextBtn.hidden = true;
    restartBtn.hidden = true;
    choicesEl.replaceChildren(
      ...item.choices.map((choice, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "quiz-choice";
        b.textContent = choice;
        b.addEventListener("click", () => pick(idx, b));
        return b;
      })
    );
    choicesEl.querySelector("button")?.focus();
  }

  function pick(idx, btn) {
    if (answered) return;
    answered = true;
    const item = questions[i];
    [...choicesEl.querySelectorAll(".quiz-choice")].forEach((b, bi) => {
      b.disabled = true;
      if (bi === item.answer) b.classList.add("is-correct");
    });
    if (idx === item.answer) {
      correct++;
      btn.classList.add("is-correct");
    } else {
      btn.classList.add("is-wrong");
    }
    explainEl.textContent = item.explain;
    explainEl.hidden = false;

    if (i < questions.length - 1) {
      nextBtn.hidden = false;
      nextBtn.focus();
    } else {
      finish();
    }
  }

  function finish() {
    progress.recordQuiz(moduleId, correct, questions.length);
    countEl.textContent = "done";
    qEl.textContent = `You scored ${correct} of ${questions.length}.`;
    choicesEl.replaceChildren();
    explainEl.textContent =
      correct === questions.length
        ? "Full marks — this module is now marked mastered."
        : "Revisit the model above, then try again.";
    explainEl.hidden = false;
    restartBtn.hidden = false;
    restartBtn.focus();
  }

  nextBtn.addEventListener("click", () => {
    i++;
    renderQuestion();
  });
  restartBtn.addEventListener("click", () => {
    i = 0;
    correct = 0;
    renderQuestion();
  });

  renderQuestion();
}
