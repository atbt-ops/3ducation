import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
export const firebaseConfigured = Object.values(config).every(Boolean);
export const app = firebaseConfigured ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const authReady = auth
  ? setPersistence(auth, browserLocalPersistence).catch(() => {})
  : Promise.resolve();
// UI hints only. Firestore enforces the signed admin custom claim independently.
const admins = new Set();
export async function refreshAdmin(user) {
  if (!user) return;
  try {
    const token = await user.getIdTokenResult();
    if (token.claims.admin === true) admins.add(user.uid);
    else admins.delete(user.uid);
  } catch {
    admins.delete(user.uid);
  }
}
export const isAdmin = (user) => !!user && admins.has(user.uid);
