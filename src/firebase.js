import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzEEJ9wS2pvM24JFExQBK62UX0PAOMXbA",
  authDomain: "srethackathons.firebaseapp.com",
  projectId: "srethackathons",
  storageBucket: "srethackathons.firebasestorage.app",
  messagingSenderId: "834244206366",
  appId: "1:834244206366:web:e0b7a9b23fde053d5df30f",
  measurementId: "G-030QMT62DW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
