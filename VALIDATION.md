# Verification record

Executed against the enhanced uploaded project on 17 November 2026.

| Area | Evidence |
| --- | --- |
| Original experiments | All 75 modules constructed successfully and completed 30 smoke-test animation frames; registry metadata and quiz structure checked |
| Unit/geometry/security runtime | 118 Vitest tests passed, including original physics/expression tests, every new instrument assembly, component coverage, formula modes, storage recovery, account isolation, deterministic merge/reset/deletion and malicious-code rejection |
| Firestore authorization | 27 emulator checks passed, covering owner-only progress, unauthenticated access denial, schema bounds, author spoofing, private pending submissions, admin moderation, revision/resubmission, public approved reads and immutable published author content |
| Build | Vite production build succeeded with a Workbox service worker precaching 119 application resources (approximately 4.7 MiB before compression) |
| Lint | ESLint passed |
| Browser interactions | Catalog search, opening a microscope lesson, marking it completed, persistence through reload, saving/restoring a formula, circle/derivative/integral plots, syntax-highlighted editor and local contribution draft checked |
| Offline shell | Production app reported Offline learning ready; after stopping its preview server, reload and navigation to all 75 instrument catalog entries still worked through the service-worker cache |
| GPU rendering | Not visually verified: the supplied cloud browser has WebGL disabled. All model geometry and scene construction passed automated checks. The disabled-WebGL fallback was checked in the browser |
| Real Firebase project | Not connected: no user-owned project configuration was supplied. Authorization was verified with the Firebase emulator, not a live project |
| Device coverage | Responsive CSS and touch/keyboard controls implemented. Physical phone/tablet testing remains to be done |

## Before your public launch

Configure your Firebase project, deploy its rules, create a reviewer claim, and verify sign-up/sign-in, two-device synchronization, offline queue upload and moderation using real test accounts. Inspect representative 3D instruments and developer previews in a WebGL-enabled desktop browser and on a phone. This is necessary because neither the user-owned cloud project nor GPU rendering was available in the test environment.

External videos and resource URLs require internet. Public community cache entries remain available offline until refreshed; a previously cached entry cannot be remotely withdrawn from a disconnected device. LocalStorage is account-scoped within the application but is not an encrypted vault on a shared browser profile.
