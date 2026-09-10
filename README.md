# 3ducation — Orbit Lab

An interactive 3D educational lab. Four self-contained instruments, each running on
real equations and measured values:

| Module         | Subject               | What it does                                          |
| -------------- | --------------------- | ---------------------------------------------------- |
| Pendulum       | Physics · Mechanics   | Swing a bob; tune length/gravity/angle, watch KE↔PE  |
| Molecule kit   | Chemistry · Bonding   | Rotate H₂O, CH₄, CO₂, NH₃ with real bond angles      |
| Geometry set   | Math · Solids         | Nine solids; V − E + F and volume formulas           |
| Orrery         | Astronomy · Orbits    | Six planets on real relative orbital periods         |

## Source

Pulled from the Claude artifact **Orbit Lab**:
https://claude.ai/code/artifact/a977440a-af96-4f84-ad69-76482af27554

## Run locally

It's a single static file. Any of:

```bash
# Python
python -m http.server 8000
# then open http://localhost:8000

# Node
npx serve .
```

Or just open `index.html` directly in a browser.

## Notes

- [three.js](https://threejs.org/) r128 is loaded from cdnjs (needs a network connection).
- Written as a Claude Artifact, so the `<head>` is minimal and `<title>`/font `<link>`
  sit at the top of `<body>`. Browsers handle this fine; tidy it if you move away from
  the artifact format.
- `window.claude.hot.*` calls are guarded in try/catch and no-op outside the artifact runtime.
