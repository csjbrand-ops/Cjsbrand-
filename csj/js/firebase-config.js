// firebase-config.js
// Shared Firebase initialization for CSJ — Chotty Shah Jee
// Uses Firebase v10 modular SDK loaded straight from the CDN, so this file
// works unmodified on GitHub Pages with no build step.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAimzZ6tYYaBvtcVSYUUMkYHruPi-4",
  authDomain: "csj-brand.firebaseapp.com",
  projectId: "csj-brand",
  storageBucket: "csj-brand.firebasestorage.app",
  messagingSenderId: "447432500382",
  appId: "1:447432500382:web:812a8bc0ae51dc9bcc478f",
  measurementId: "G-MVPNRKQ653"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// The one and only admin UID. Every admin-only check in this project
// compares against this constant rather than trusting an email address.
export const ADMIN_UID = "QJjEVBmFJBadwqXKGn4ITtxJlXi1";
export const ADMIN_EMAIL = "csjbrand@gmail.com";

// WhatsApp order number, international format (no + or leading 0s).
export const WHATSAPP_NUMBER = "923227707172";

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
};
