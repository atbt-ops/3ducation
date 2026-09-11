// Firebase project wiring. These values are public client identifiers (not
// secrets) — safety comes from the Firestore security rules (see
// firestore.rules), not from hiding this config.
// Deliberately no firebase/firestore import here — that SDK slice is the
// heaviest part and only src/db.js (loaded lazily, see main.js) needs it.
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

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

// Firebase defaults to persisting sign-in indefinitely (browserLocalPersistence),
// which is why a closed and reopened browser stays signed in as whoever last
// signed in. Session persistence keeps someone signed in across page reloads
// and tab navigation, but clears once every tab/window for this site closes —
// the next visit asks for sign-in again. auth.js awaits this before any actual
// sign-in call, so the mode is always set first.
export const authReady = setPersistence(auth, browserSessionPersistence);

// Keep this list in sync with the admin check in firestore.rules.
export const ADMIN_EMAILS = ["thrilochanprasad@gmail.com"];

export function isAdmin(user) {
  return !!user && !!user.email && ADMIN_EMAILS.includes(user.email);
}
