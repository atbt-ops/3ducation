// Firebase project wiring. These values are public client identifiers (not
// secrets) — safety comes from the Firestore security rules (see
// firestore.rules), not from hiding this config.
// Deliberately no firebase/firestore import here — that SDK slice is the
// heaviest part and only src/db.js (loaded lazily, see main.js) needs it.
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCCysgnSmnsKc23bozIi-calAlkoLB7Ldk",
  authDomain: "ducation-a024c.firebaseapp.com",
  projectId: "ducation-a024c",
  storageBucket: "ducation-a024c.firebasestorage.app",
  messagingSenderId: "809469012575",
  appId: "1:809469012575:web:26388da6e91a2272b809ea",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Sign-in is sticky by design: stay signed in as the same person indefinitely
// (across reloads, tab closes, browser restarts) until they explicitly sign
// out. browserLocalPersistence is Firebase's default already; set explicitly
// so this is a decision, not an accident. auth.js awaits this before any
// actual sign-in call, so the mode is always set first.
export const authReady = setPersistence(auth, browserLocalPersistence);

// Keep this list in sync with the admin check in firestore.rules.
export const ADMIN_EMAILS = ["thrilochanprasad@gmail.com"];

export function isAdmin(user) {
  return !!user && !!user.email && ADMIN_EMAILS.includes(user.email);
}
