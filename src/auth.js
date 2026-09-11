import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase.js";

const FRIENDLY = {
  "auth/email-already-in-use": "That email already has an account — try signing in instead.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/weak-password": "Password needs to be at least 6 characters.",
  "auth/wrong-password": "Wrong password.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/user-not-found": "No account found with that email.",
  "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
  "auth/popup-closed-by-user": "Sign-in was closed before finishing.",
  "auth/network-request-failed": "Network error — check your connection.",
};

function friendly(err) {
  return FRIENDLY[err?.code] || err?.message || "Something went wrong.";
}

export async function signUp(name, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return { user: cred.user };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { user: cred.user };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function signInGoogle() {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return { user: cred.user };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export function signOutUser() {
  return signOut(auth);
}

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}
