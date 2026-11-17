# Run the enhanced Spark project

This is an extension of your uploaded Spark project. Its Vite / vanilla JavaScript / Three.js architecture, design tokens, original 75 experiment modules, quizzes and existing routes are retained.

## Windows and VS Code

1. Extract the ZIP and open the `Spark-main` folder in VS Code.
2. Install Node.js 22 or newer if `node -v` is not recognized. Restart VS Code after installation.
3. In the VS Code terminal, run:

```powershell
node -v
npm -v
npm ci
npm run dev
```

4. Open the local URL printed by Vite. Use the added navigation: **75 instruments**, **Formula Box**, **My learning**, and **Contribute**.

If PowerShell blocks `npm.ps1`, use `npm.cmd ci` and `npm.cmd run dev`, or choose Command Prompt as the VS Code terminal. There is no need to disable PowerShell security globally.

## Test offline access

Service workers are enabled in production builds, not the normal development server:

```powershell
npm run build
npm run preview
```

Open the printed URL while online. Wait for **Offline learning ready**. Reload once, then disconnect the network and open experiments, instrument lessons, Formula Box, My learning and saved drafts. The application shell and built-in assets are precached; external videos and linked websites are not. Previously fetched approved community resources are cached separately.

Install using **Install Spark** when your browser offers the installation prompt, or the browser's Install / Add to Home Screen menu. HTTPS (or localhost during development) is required. Browser eviction of site storage can remove offline files and progress; use the dashboard's backup export when needed.

## Activate your own Firebase project

The uploaded third-party Firebase project configuration has been removed. Local features work without Firebase. Cloud sign-in, uploads, moderation and cross-device sync need the following one-time project setup:

1. Create or select **your own** Firebase project and register a Web app.
2. Create a Cloud Firestore database in production mode.
3. Enable Email/Password under Authentication; enable Google if you want Google sign-in.
4. Add your actual hosting domain to Authentication's authorized domains. Add `localhost` for local development if needed.
5. Copy `.env.example` to `.env.local` and fill the four public Firebase Web configuration fields:

```dotenv
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-web-app-id
```

6. Publish the contents of `firestore.rules` in Firebase Console, or deploy the rules with the Firebase CLI while signed in to your own project:

```powershell
npx firebase login
npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

7. Restart the dev server, or rebuild and redeploy the production site. Vite variables are build-time values. No `.env.local` file or service-account key should be committed or uploaded publicly.
8. Grant reviewers a Firebase Authentication custom claim `{ admin: true }` from a trusted Admin SDK environment. Example for an authorized project administrator:

```js
// Run only on a trusted administrative machine/server, never in src/ or a browser.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
initializeApp({ credential: applicationDefault() });
const user = await getAuth().getUser('REVIEWER_UID');
await getAuth().setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
```

Install `firebase-admin` only in that trusted administrative environment and authenticate through its supported server credentials. After a claim change, sign out and back in. The Review link appears for the admin; Firestore rules independently enforce the claim.

Firebase Web identifiers are visible in a browser bundle by design. They are not private Admin SDK credentials. Rules and authenticated claims protect records; hiding the client configuration does not protect a database.

## Contributions

- **No code:** write an instrument explanation, experiment or educational resource. Optional HTTPS resource link and raster illustration. Images are resized and re-encoded locally.
- **Developer:** write a simulation using the documented restricted Three.js API. Validate and preview it, then submit. Imports, loops and browser/network APIs are deliberately unsupported. Full modules remain supported as inert source in the preserved form at `#/submit/formula`.
- **Formula and quizzes:** the existing no-code quiz builder remains at `#/submit/formula`.
- **Offline:** use Save draft. Signed-in submissions enter a durable upload queue. Guest drafts can be copied explicitly into a signed-in account from My learning.
- **Review:** administrators approve, reject or request changes. Revision requests include notes; authors edit and resubmit the same record. Approved items appear in Community and on contributor profiles.
- Synchronization retries on reconnection and every 30 seconds while the page is open. It resumes when the app is reopened; it does not run with the browser fully closed.

## Verification commands

```powershell
npm run lint
npm test
npm run smoke
npm run test:security
npm run build
```

The security command uses an isolated `demo-spark-enhanced` Firestore emulator and requires Java 21. It does not access production Firebase. See `VALIDATION.md` for the checks performed and limitations.

## GitHub Pages

The original deployment workflow is retained and updated for Node 22. Configure GitHub Pages to use GitHub Actions. To activate cloud features, set repository variables matching the four `VITE_FIREBASE_*` names. The base path defaults to `./`; set `DEPLOY_BASE` for a particular subdirectory if necessary. Never add an Admin SDK private key to frontend variables.

## Model and device scope

The instrument cabinet uses 75 simplified procedural educational models rather than manufacturer CAD models or photorealistic scans. Each includes working principles, applications and selectable components. Desktop orbit/zoom/pan, keyboard controls and touch gestures are provided in the new viewer. Models are generated locally, with limited geometry and device pixel ratio.

3D requires a WebGL-capable browser. When unavailable, instrument descriptions, the original lessons/quizzes, 2D formula plots, drafts and progress remain usable. Numerical graphs are educational approximations; implicit plots use a finite grid and derivatives/integrals use numerical sampling.
