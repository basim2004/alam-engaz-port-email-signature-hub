import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyDSYoB52U6Z60D469dccF0-JA-67PPQR8k",
  authDomain: "alam-engaz-port-hub.firebaseapp.com",
  projectId: "alam-engaz-port-hub",
  storageBucket: "alam-engaz-port-hub.firebasestorage.app",
  messagingSenderId: "12973983299",
  appId: "1:12973983299:web:f6b17e9391837f4ae976f6",
  measurementId: "G-Q5X5RBJFP9"
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? (() => {
  try {
    return getAnalytics(app);
  } catch {
    return null;
  }
})() : null;
export const db = getFirestore(app);
export const auth = getAuth(app);

