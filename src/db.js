// Firestore is the heaviest slice of the Firebase SDK, so it's kept in its
// own module — only reached via the dynamic import()s in main.js (on sign-in,
// or on visiting #/submit or #/review) rather than loaded for every visitor.
import { getFirestore } from "firebase/firestore";
import { app } from "./firebase.js";

export const db = getFirestore(app);
