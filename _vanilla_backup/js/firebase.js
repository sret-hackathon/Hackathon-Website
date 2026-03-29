// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzEEJ9wS2pvM24JFExQBK62UX0PAOMXbA",
  authDomain: "srethackathons.firebaseapp.com",
  projectId: "srethackathons",
  storageBucket: "srethackathons.firebasestorage.app",
  messagingSenderId: "834244206366",
  appId: "1:834244206366:web:e0b7a9b23fde053d5df30f",
  measurementId: "G-030QMT62DW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
