// Subject accent colors — shared by the home page, the instrument view, and
// the community/review pages, so the whole site uses one color language for
// subjects. Physics/Chemistry/Math reuse the app's existing brand hues; the
// rest get their own (see the --subj-* tokens in style.css, light+dark aware).
export const SUBJECT_ACCENT = {
  Physics: "var(--subj-physics)",
  Chemistry: "var(--subj-chemistry)",
  Math: "var(--subj-math)",
  Biology: "var(--subj-biology)",
  "Earth Science": "var(--subj-earth)",
  Astronomy: "var(--subj-astronomy)",
};
