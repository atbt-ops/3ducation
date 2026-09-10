# 3ducation

**A free, interactive 3D science lab for classes I–XII.** 24 hands-on instruments
across physics, chemistry, biology, maths and space — each running on the real
equations, each with a short lesson, guided experiments and a check-yourself quiz.
Plus all 118 elements and a formula box that plots anything you type. No account,
works offline. Filter by subject or by school level (Primary / Middle / Secondary).

🔗 **Live:** https://atbt-ops.github.io/3ducation/

| Subject       | Instruments |
| ------------- | ----------- |
| **Physics**   | Pendulum · Projectile range · Mass on a spring · Ramp & friction · Ohm's law loop · Wave interference · Standing waves · Converging lens · Float or sink |
| **Chemistry** | Molecule kit · States of matter · Atom builder · Periodic table (118 elements) |
| **Biology**   | Cell explorer · DNA double helix |
| **Maths**     | Geometry set · Surface studio (`z = f(x,y)`) · Fraction wall · Times table · Unit circle · Galton board |
| **Space**     | Orrery · Moon phases · Seasons & the tilt |

Most instruments ship a set of **guided experiments** — one click dials in a named
setup and poses a question. The Surface studio uses a small safe expression engine
(`src/lib/expr.js`) so any formula in `x`, `y`, `k` plots live. Each module declares
a `grades: [min, max]` range that drives the school-level filter.

## Develop

```bash
npm install
npm run dev        # vite dev server
npm test           # vitest — pure-physics unit tests (src/lib/physics.js)
npm run lint       # eslint
npm run build      # generates PWA icons, then builds to dist/
npm run preview    # serve the production build
```

CI (`.github/workflows/deploy.yml`) runs `lint` → `test` → `build` before deploying.

- **Stack:** [Vite](https://vitejs.dev/) + vanilla ES modules + [three.js](https://threejs.org/) (r0.160, bundled — no CDN).
- **Offline:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) precaches the app; it installs as a PWA.
- **Progress:** stored in `localStorage` only (`src/state.js`). No backend, no tracking.

### Project layout

```
src/
  main.js            app shell + hash router + render loop + subject filter
  style.css          design tokens + components (light/dark)
  state.js           localStorage progress (visited / quiz best)
  lib/
    physics.js       pure formulas (pendulum, projectile, Ohm, thin lens…) — unit tested
    expr.js          safe math-expression evaluator (shunting-yard, no eval) — unit tested
    elements.js      periodic-table data + category palette
  engine/
    viewer.js        shared WebGL renderer + orbit camera (mouse + keyboard) + tone-map toggle
    helpers.js       lights, bonds, grids, contact shadows, reduced-motion flag
  learn/
    quiz.js          check-for-understanding component
    presets.js       guided-experiment strip (applies values to a module's inputs)
  modules/
    index.js         registry (order = workshop grid order) + SUBJECTS
    <module>.js       each: scene, view, lesson, quiz, presets, panelHTML/wire, update
test/
  physics.test.js    vitest coverage for src/lib/physics.js
  expr.test.js       vitest coverage for src/lib/expr.js
```

### Add a module

Create `src/modules/foo.js` default-exporting an object with `id, name, tag,
subject, blurb, icon, scene, view, lesson, quiz, panelHTML(), wire(root),
update(dt, viewer), onEnter(viewer), onExit(viewer)`, then add it to the array in
`src/modules/index.js`.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main`. Set **Settings → Pages → Source: GitHub Actions** once. The base path
is `/3ducation/` (`vite.config.js`); override with `DEPLOY_BASE` for a custom domain.

## License

[MIT](LICENSE). Contributions welcome.

---

*Started from the "Orbit Lab" Claude artifact and rebuilt into a full app.*
