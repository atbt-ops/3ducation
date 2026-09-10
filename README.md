# 3ducation

**A free, interactive 3D science lab.** Seven hands-on instruments across physics,
chemistry, math and astronomy — each running on the real equations, each with a
short lesson and a check-yourself quiz. No account, works offline.

🔗 **Live:** https://atbt-ops.github.io/3ducation/

| Module              | Subject               | Core idea                                        |
| ------------------- | --------------------- | ----------------------------------------------- |
| Pendulum            | Physics · Mechanics   | `T = 2π√(L/g)`, energy trading KE ↔ PE          |
| Projectile range    | Physics · Kinematics  | `R = v²·sin(2θ)/g`, the 45° optimum             |
| Wave interference   | Physics · Waves       | Path difference → constructive / destructive     |
| Molecule kit        | Chemistry · Bonding   | VSEPR: electron pairs repel → shape              |
| Geometry set        | Math · Solids         | Euler's `V − E + F = 2`, volume scaling          |
| Surface grapher     | Math · Functions      | `z = f(x, y)` surfaces: bowls, saddles, bells    |
| Orrery              | Astronomy · Orbits    | Kepler's third law, `T² ∝ a³`                    |

## Develop

```bash
npm install
npm run dev        # vite dev server
npm run build      # generates PWA icons, then builds to dist/
npm run preview    # serve the production build
```

- **Stack:** [Vite](https://vitejs.dev/) + vanilla ES modules + [three.js](https://threejs.org/) (r0.160, bundled — no CDN).
- **Offline:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) precaches the app; it installs as a PWA.
- **Progress:** stored in `localStorage` only (`src/state.js`). No backend, no tracking.

### Project layout

```
src/
  main.js            app shell + hash router + render loop
  style.css          design tokens + components (light/dark)
  state.js           localStorage progress (visited / quiz best)
  engine/
    viewer.js        shared WebGL renderer + orbit camera (mouse + keyboard)
    helpers.js       lights, bonds, grids, disposal
  learn/
    quiz.js          check-for-understanding component
  modules/
    index.js         registry (order = workshop grid order)
    <module>.js       each: scene, view, lesson, quiz, panelHTML/wire, update
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
