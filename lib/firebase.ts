/**
 * Firebase client SDK initialization.
 *
 * Used by:
 * - The public registration form (anonymous create on `businesses` collection)
 * - The admin panel (auth + read/write of pending businesses)
 *
 * NOT used by the public site for browsing - the public site is fully static
 * and reads businesses at build time via firebase-admin (see firebase-admin.ts).
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "zafon-biz",
  appId: "1:742020373926:web:8a4d79af20db5997208367",
  apiKey: "AIzaSyBHxsNWxOixhIBOCOyoHeNGirM-9EcKxnk",
  authDomain: "zafon-biz.firebaseapp.com",
  messagingSenderId: "742020373926",
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export { app };
