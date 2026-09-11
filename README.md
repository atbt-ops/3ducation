# 3ducation

**A free, interactive 3D science lab for classes I–XII.** 61 hands-on instruments
across physics, chemistry, biology, earth science, maths and space — each running
on the real equations, each with a short lesson, guided experiments and a
check-yourself quiz. Plus all 118 elements and a formula box that plots anything
you type. Works offline; sign-in is optional and only used to sync your progress
and to submit new instruments. The home page shows one tile per subject — click
through to that subject's own page for its full instrument list — and everything
can be filtered by school level (Primary / Middle / Secondary) or found by search.

🔗 **Live:** https://atbt-ops.github.io/3ducation/

| Subject       | Instruments |
| ------------- | ----------- |
| **Physics**   | Pendulum · Projectile range · Mass on a spring · Ramp & friction · Newton's cradle · Levers & balance · Ohm's law loop · Series & parallel · Magnetic field · Electromagnet · Electric charges · Wave interference · Standing waves · Sound: pitch & loudness · Converging lens · Refraction · Float or sink · Heat flow |
| **Chemistry** | Molecule kit · States of matter · Atom builder · Gas laws · The pH scale · Reaction rate · Balancing equations · Periodic table (118 elements) |
| **Biology**   | Cell explorer · DNA double helix · Photosynthesis · The heart · Energy pyramid · Punnett square |
| **Earth Science** | The water cycle |
| **Maths**     | Geometry set · Surface studio (`z = f(x,y)`) · Fraction wall · Times table · Unit circle · Pythagoras · Similar triangles · Line grapher · Mean/median/mode · Galton board · Dice sums · Slope of a curve |
| **Space**     | Orrery · Moon phases · Seasons & the tilt |

Most instruments ship a set of **guided experiments** — one click dials in a named
setup and poses a question. The Surface studio uses a small safe expression engine
(`src/lib/expr.js`) so any formula in `x`, `y`, `k` plots live. Twelve instruments
also carry a linked **video lecture** (a "Watch" panel, privacy-mode YouTube embed) —
add one to any module with a `video: { id, title }` field. Each module declares
a `grades: [min, max]` range that drives the school-level filter.

## Develop

```bash
npm install
npm run dev        # vite dev server
npm test           # vitest — pure-function unit tests (physics.js, expr.js)
npm run smoke      # construct every module + run 30 update frames, headless
npm run lint       # eslint
npm run build      # generates PWA icons, then builds to dist/
npm run preview    # serve the production build
```

CI (`.github/workflows/deploy.yml`) runs `lint` → `test` → `smoke` → `build` before deploying.
`npm run smoke` (`scripts/smoke.mjs`) stubs the DOM and imports every module — it catches
import errors, bad geometry arguments and throws inside `update()` without a browser.

- **Stack:** [Vite](https://vitejs.dev/) + vanilla ES modules + [three.js](https://threejs.org/) (r0.160, bundled — no CDN).
- **Offline:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) precaches the app; it installs as a PWA.
- **Progress:** always kept in `localStorage` (`src/state.js`) first. If you sign in,
  `src/sync.js` mirrors it to Firestore (`progress/{uid}`, merged by best score) so it
  follows you across devices — signing out or never signing in changes nothing else.
- **Auth:** Firebase (`src/firebase.js`, `src/auth.js`) — email/password and Google.
  `firebase/firestore` is only fetched on sign-in or when visiting `#/submit` /
  `#/review`, via dynamic `import()`, so signed-out visitors never download it.

### Project layout

```
src/
  main.js            app shell + hash router + render loop + auth area + subject pages
  style.css          design tokens + components (light/dark)
  state.js           localStorage progress (visited / quiz best)
  firebase.js        Firebase app + auth init, ADMIN_EMAILS/isAdmin (no firestore — see db.js)
  db.js              firestore init, split out so it's only fetched when actually needed
  auth.js            sign up / sign in / Google / sign out wrappers, friendly errors
  authModal.js        the sign-in/sign-up modal UI
  sync.js            mirrors localStorage progress to Firestore when signed in
  submissions.js     Firestore CRUD for community submissions
  lib/
    physics.js       pure formulas (pendulum, projectile, Ohm, thin lens…) — unit tested
    expr.js          safe math-expression evaluator (shunting-yard, no eval) — unit tested
    elements.js      periodic-table data + category palette
    surfaceMesh.js   shared z=f(x,y) mesh builder (Surface studio + community formulas)
    html.js          escapeHtml, used on anything sourced from Firestore
  engine/
    viewer.js        shared WebGL renderer + orbit camera (mouse + keyboard) + tone-map toggle
    helpers.js       lights, bonds, grids, contact shadows, reduced-motion flag
  learn/
    quiz.js          check-for-understanding component
    presets.js       guided-experiment strip (applies values to a module's inputs)
  modules/
    registry.js      lightweight metadata (id..icon/video) + a lazy loader per
                      instrument (order = workshop grid order) — importing this
                      never triggers any instrument's own THREE.js scene code
    index.js         re-exports registry.js as MODULES/SUBJECTS/etc., plus
                      loadModule(id) — dynamically import()s the real file,
                      called only when that instrument is actually opened
    <module>.js       each: scene, view, lesson, quiz, presets, panelHTML/wire, update
  pages/
    submit.js        #/submit — formula (no-code) and developer-code submission forms
    review.js        #/review — admin approve/reject queue
    communityList.js #/community — approved formula instruments
    communityModule.js  turns an approved formula submission into a module-shaped object
test/
  physics.test.js    vitest coverage for src/lib/physics.js
  expr.test.js       vitest coverage for src/lib/expr.js
```

### Add a module

Create `src/modules/foo.js` default-exporting an object with `id, name, tag,
subject, grades: [min, max], blurb, icon, scene, view, lesson, quiz,
panelHTML(), wire(root), update(dt, viewer), onEnter(viewer), onExit(viewer)`
(optionally `presets`, `video: { id, title }`, `flat: true`), then add a matching
entry to `src/modules/registry.js` — the same `id` through `icon`/`video` fields
(duplicated here on purpose, so the home page never has to import your
instrument's actual scene code just to show its card) plus
`load: () => import("./foo.js")`. Run `npm run smoke` — it loads every
instrument for real (catching both a bad scene/update and any mismatch between
the registry's metadata and the module's own), before you ever open a browser.

## Community submissions

Signed-in users can propose a new instrument at `#/submit`, in one of two tracks:

- **Formula plot (no code)** — a name, subject, grade range, description and a
  `z = f(x, y)` formula, validated live against the same evaluator Surface studio
  uses (`src/lib/expr.js` — no `eval`, arithmetic only), plus an optional
  check-yourself quiz (up to 5 questions, built with a plain form — no markup or
  code). Anyone can do this; no programming knowledge needed. **Approving one
  publishes it immediately** at `#/community/<id>` (listed on `#/community`) —
  there's nothing unsafe a formula or a quiz question could do, so it doesn't
  need a code review or a deploy.
- **Developer code** — full module code, same shape as "Add a module" above, for
  someone who wants to build a fully custom instrument. Saved as text and
  **never executed** — approving it does *not* publish it; see below.

Both are saved to Firestore (`submissions/{id}`, status `pending`). Admins (emails
in `ADMIN_EMAILS` in `src/firebase.js`, matching `firestore.rules`) review
everything at `#/review`.

To ship an approved **code** submission:

1. Read it on the review page (rendered as escaped text, never executed).
2. Copy it into a new `src/modules/<id>.js`, review and clean it up properly
   (treat it like any external PR — check it against the module interface,
   the existing safety patterns, and the a11y/perf conventions elsewhere in
   `src/modules/`).
3. Add a matching entry (metadata + `load: () => import("./<id>.js")`) to
   `src/modules/registry.js`.
4. Run `npm run lint && npm test && npm run smoke && npm run build`, then commit
   and push — CI deploys it like any other change.

Approved **formula** submissions need none of this — `src/pages/communityModule.js`
turns the stored formula into a module-shaped object on the fly (reusing
`src/lib/surfaceMesh.js`, the same surface renderer Surface studio uses) and
renders it through the normal module view.

### Firebase setup (for a fresh fork/deploy)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication → Sign-in method**: enable Email/Password (and Google, optional).
3. **Authentication → Settings → Authorized domains**: add your GitHub Pages domain.
4. **Firestore Database → Create database** (Standard edition, production mode).
5. **Firestore Database → Rules**: paste in [`firestore.rules`](firestore.rules) and publish.
6. **Project settings → General → Your apps**: register a web app, copy the config
   into `src/firebase.js`, and list admin email(s) in `ADMIN_EMAILS` there (keep
   `firestore.rules`' `isAdmin()` list in sync — that's the one actually enforced).

These config values are public client identifiers, safe to commit — the real
security boundary is `firestore.rules`, not the config's secrecy.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main`. Set **Settings → Pages → Source: GitHub Actions** once. The base path
is `/3ducation/` (`vite.config.js`); override with `DEPLOY_BASE` for a custom domain.

## License

[MIT](LICENSE). Contributions welcome.

---

*Started from the "Orbit Lab" Claude artifact and rebuilt into a full app.*
