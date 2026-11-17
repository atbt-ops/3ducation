# SparkLab

**A free, interactive 3D science lab for classes I–XII.** The original 75 experiments are preserved, with an additional cabinet of 75 scientific instrument models. Explore
across physics, chemistry, biology, and maths — each running
on the real equations, each with a short lesson, guided experiments and a
check-yourself quiz. Plus all 118 elements and a Formula Box for supported functions and equations. Works offline; sign-in is optional and only used to sync your progress
and to submit new instruments. The home page shows one tile per subject — click
through to that subject's own page for its full instrument list — and everything
can be filtered by school level (Primary / Middle / Secondary) or found by search.

This enhanced edition extends the uploaded Spark codebase; it does not replace its architecture or existing experiment modules. See [SETUP.md](SETUP.md) for Windows/VS Code steps, cloud activation and verification limits.

| Subject       | Instruments |
| ------------- | ----------- |
| **Physics**   | Pendulum · Projectile range · Mass on a spring · Ramp & friction · Newton's cradle · Levers & balance · Ohm's law loop · Series & parallel · Magnetic field · Magnetic compass · Electromagnet · Electromagnetic induction · Electric motor · Electric generator · Electric charges · Wave interference · Standing waves · Sound: pitch & loudness · Converging lens · Refraction · The human eye · Prism & dispersion · Why the sky is blue · Float or sink · Mercury barometer · Heat flow · Thermometer · Calorimeter · Periscope · Electroscope · Spring balance |
| **Chemistry** | Molecule kit · States of matter · Atom builder · Gas laws · The pH scale · Reaction rate · Distillation · Balancing equations · Periodic table (118 elements) |
| **Biology**   | Cell explorer · Compound microscope · DNA double helix · Photosynthesis · The heart · Energy pyramid · Punnett square · Stethoscope · Sphygmomanometer · Dialysis machine · Reflex hammer · Reaction time ruler |
| **Maths**     | Geometry set · Counting blocks · Reading the clock · Pan balance · Surface studio (`z = f(x,y)`) · Fraction wall · Times table · Unit circle · Clinometer · Pythagoras · Similar triangles · Line grapher · Mean/median/mode · Galton board · Dice sums · Slope of a curve |

Most instruments ship a set of **guided experiments** — one click dials in a named
setup and poses a question. The Surface studio uses a small safe expression engine
(`src/lib/expr.js`) so any formula in `x`, `y`, `k` plots live. Twelve instruments
also carry a linked **video lecture** (a "Watch" panel, privacy-mode YouTube embed) —
add one to any module with a `video: { id, title }` field. Each module declares
a `grades: [min, max]` range that drives the school-level filter.

## Develop

```bash
npm ci
npm run dev        # vite dev server
npm test           # physics, expressions, model catalog, storage and sandbox tests
npm run test:security # isolated Firestore emulator (Java 21 required)
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
  firebase.js        Firebase app + auth init, custom-claim-based isAdmin (no firestore — see db.js)
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
  features/          additive instrument, formula, dashboard and contribution pages
                     durable store, isolated restricted-code preview runtime
  instruments/       75-item catalog and reusable procedural Three.js models
  modules/
    registry.js      lightweight metadata (id..icon/video) + a lazy loader per
                      instrument (order = workshop grid order) — importing this
                      never triggers any instrument's own THREE.js scene code
    index.js         re-exports registry.js as MODULES/SUBJECTS/etc., plus
                      loadModule(id) — dynamically import()s the real file,
                      called only when that instrument is actually opened
    <module>.js       each: scene, view, lesson, quiz, presets, panelHTML/wire, update
  pages/
    submit.js        #/submit/formula — preserved formula/quiz and full-module forms
    review.js        #/review — admin approve/reject queue
    communityList.js #/community — approved resources, formulas and simulations
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

## Enhanced learning tools

| Route | Functionality |
| --- | --- |
| `#/instruments` | 75 searchable instruments: Physics 20, Chemistry 20, Biology 20, Mathematics 15 |
| `#/formula` | 2D functions, implicit equations, 3D surfaces, numerical derivatives and integrals; parameter sliders and saved views |
| `#/dashboard` | Explored/completed activities, quiz progress, saved views, JSON backups and explicit guest-to-account import |
| `#/submit` | No-code learning content and images; CodeMirror editor, restricted Three.js previews, durable drafts and queued submissions |
| `#/submit/formula` | Existing formula + quiz builder; full ES-module contributions retained as inert source |
| `#/review` | Admin approval, rejection and revision requests with notes |
| `#/community` | Approved resources, mathematical surfaces and sandboxed simulations; cached previously fetched entries |
| `#/contributors/<uid>` | Public contributor name and approved contribution history |

The new instrument models are lightweight procedural teaching assemblies, **not photorealistic scans**. Geometry and dimensions are simplified. They support orbit, zoom, pan, part inspection, separated views and completion tracking. Existing experiment simulations and quizzes remain in `src/modules/`.

## Community workflow and security

Guest users can save drafts and preview supported code. Signed-in users submit through a durable local queue. A stable account-prefixed document ID prevents duplicate records when uploads retry. Administrators use the server-issued `admin: true` custom claim; no email allowlist is trusted. Pending contributions are visible only to their author and administrators. Approval publishes the contribution. Revision requests require a note; authors can revise and resubmit the same record. Published content cannot be silently edited by its author.

Developer simulations use an **allowlisted JavaScript teaching subset**, parsed with Acorn and interpreted without `eval` or `Function`. No imports, arbitrary functions, loops, computed property access, browser APIs, DOM, storage, network calls or prototype traversal are allowed. Geometry/material constructors and transform methods are explicitly allowed and bounded. The trusted runtime runs in a `sandbox="allow-scripts"` iframe without same-origin permission and with a restrictive CSP. Full JavaScript modules submitted through the preserved form remain text for manual maintainer integration; they are never executed.

Images are resized and rasterized locally to JPEG; SVG is not accepted. External resource links must use HTTPS and are opened only on user action. Public contributor profiles expose display names and approved work, not email addresses.

## Offline and synchronization

The service worker precaches the application shell, all built-in lesson chunks, model generators, editor and preview runtime. Google font requests are cached when available, with system-font fallbacks. YouTube videos and external linked websites require internet. Download the app once online and wait for **Offline learning ready** before disconnecting. New deployments prompt for reload so unsaved work can be saved first.

LocalStorage uses a versioned account-specific key. Guest progress migrates from the original key. Guest learning is copied into an account only through the dashboard button. Sync merges completed/visited flags, keeps the best quiz ratio, uses timestamped saved-item updates and deletion tombstones, and preserves progress reset timestamps. Firestore transactions merge against the latest cloud snapshot; failed uploads retry on reconnection and every 30 seconds while the app is open. Submission drafts remain local; queued submissions upload separately. Synchronization does not run after the browser is fully closed.

Cloud progress is bounded to 750 KB; local state to approximately 4 MB. Storage failure keeps an in-memory copy and displays an export warning. Firestore itself also enforces document-size limits. Account data on a shared device is separated by application keys; it is not encrypted against someone with access to that browser profile.

### Firebase activation

See [SETUP.md](SETUP.md). Copy `.env.example` to `.env.local`, supply your own Firebase web configuration, enable Authentication providers, add your deployment domain, and deploy `firestore.rules`. No third-party project identifiers or Admin SDK credentials are bundled. Firebase web configuration is necessarily visible in a client build; it identifies the project and is not an authorization secret. Security comes from Authentication, custom claims and the tested Firestore rules. Never put a service-account key into any `VITE_*` variable.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main`. Set **Settings → Pages → Source: GitHub Actions** once. The default base path is relative (`./`); set `DEPLOY_BASE` for a subdirectory deployment. Set the four `VITE_FIREBASE_*` GitHub repository variables if cloud features are required. Without them, local learning still works.

## License

[MIT](LICENSE). Contributions welcome.

---

*Started from the "Orbit Lab" Claude artifact and rebuilt into a full app.*
